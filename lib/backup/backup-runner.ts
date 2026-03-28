import { spawn } from 'child_process'
import { createWriteStream } from 'fs'
import { mkdir, stat, unlink } from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { BackupStatus, BackupType } from '@prisma/client'
import { sendBackupNotification } from '@/lib/notifications/email-service'

const BACKUP_PATH = process.env.BACKUP_PATH || path.join(process.cwd(), '.backups')

function parseDatabaseUrl(url: string) {
  const match = url.match(/mysql:\/\/(?:(.+?):(.+?)@)?([^/:]+)(?::(\d+))?\/(.+)/i)
  if (!match) throw new Error('Invalid DATABASE_URL')
  return { user: match[1], pass: match[2], host: match[3], port: match[4] || '3306', db: match[5] }
}

async function deleteOlderThan(days: number, dir: string) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  try {
    const files = await (await import('fs/promises')).readdir(dir)
    for (const file of files) {
      const full = path.join(dir, file)
      const info = await stat(full)
      if (info.mtime.getTime() < cutoff) await unlink(full).catch(() => {})
    }
  } catch {
    // ignore
  }
}

async function runMysqlDump(targetDir: string) {
  const dbUrl = process.env.DATABASE_URL || ''
  const creds = parseDatabaseUrl(dbUrl)
  await mkdir(targetDir, { recursive: true })
  const filename = `${new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16)}-dreamcms.sql.gz`
  const fullPath = path.join(targetDir, filename)
  const start = Date.now()

  // Use spawn (no shell) to avoid command injection — credentials are passed as
  // separate argv entries and are never interpreted by /bin/sh.
  await new Promise<void>((resolve, reject) => {
    const dump = spawn('mysqldump', [
      `-u${creds.user}`,
      `-p${creds.pass}`,
      '-h', creds.host,
      `--port=${creds.port}`,
      '--single-transaction',
      creds.db,
    ])
    const gz = spawn('gzip', ['-c'], { stdio: ['pipe', 'pipe', 'ignore'] })
    const out = createWriteStream(fullPath)

    dump.stdout.pipe(gz.stdin)
    gz.stdout.pipe(out)

    let stderr = ''
    dump.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString() })

    let failed = false
    function fail(err: Error) { if (!failed) { failed = true; reject(err) } }

    dump.on('error', fail)
    gz.on('error', fail)
    out.on('error', fail)

    dump.on('close', (code) => {
      if (code !== 0) fail(new Error(`mysqldump failed (exit ${code}): ${stderr.trim()}`))
    })
    out.on('finish', () => { if (!failed) resolve() })
  })

  const size = (await stat(fullPath)).size
  const duration = Math.round((Date.now() - start) / 1000)
  await deleteOlderThan(30, targetDir)
  return { fullPath, size, duration }
}

async function runMediaSync(targetDir: string) {
  await mkdir(targetDir, { recursive: true })
  const src = path.join(process.cwd(), 'public', 'media', 'uploads') + '/'
  const start = Date.now()

  await new Promise<void>((resolve, reject) => {
    const proc = spawn('rsync', ['-av', src, targetDir + '/'])
    proc.on('error', reject)
    proc.on('close', (code) => {
      if (code !== 0) reject(new Error(`rsync failed (exit ${code})`))
      else resolve()
    })
  })

  const info = await stat(targetDir)
  const duration = Math.round((Date.now() - start) / 1000)
  return { fullPath: targetDir, size: info.size, duration }
}

export async function runBackup(type: BackupType) {
  const log = await prisma.backupLog.create({
    data: { type, status: BackupStatus.RUNNING },
  })

  const start = Date.now()
  try {
    let result: { fullPath: string; size: number; duration: number }
    if (type === 'DATABASE') {
      const dir = path.join(BACKUP_PATH, 'db')
      result = await runMysqlDump(dir)
    } else if (type === 'MEDIA') {
      const dir = path.join(BACKUP_PATH, 'media')
      result = await runMediaSync(dir)
    } else {
      const db = await runMysqlDump(path.join(BACKUP_PATH, 'db'))
      const media = await runMediaSync(path.join(BACKUP_PATH, 'media'))
      result = { fullPath: `${db.fullPath};${media.fullPath}`, size: db.size + media.size, duration: db.duration + media.duration }
    }

    const updated = await prisma.backupLog.update({
      where: { id: log.id },
      data: {
        status: BackupStatus.SUCCESS,
        filePath: result.fullPath,
        fileSize: result.size,
        duration: result.duration || Math.round((Date.now() - start) / 1000),
      },
    })

    await sendBackupNotification('SUCCESS', updated)
    return updated
  } catch (error: unknown) {
    const updated = await prisma.backupLog.update({
      where: { id: log.id },
      data: {
        status: BackupStatus.FAILED,
        error: error instanceof Error ? error.message : 'Backup failed',
        duration: Math.round((Date.now() - start) / 1000),
      },
    })

    await sendBackupNotification('FAILED', updated)
    return updated
  }
}
