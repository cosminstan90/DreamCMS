import { NextResponse } from 'next/server'
import { runBackup } from '@/lib/backup/backup-runner'
import { BackupType } from '@prisma/client'
import { auth } from '@/auth'
import { timingSafeEqualString } from '@/lib/security/secrets'
import { logAdminAudit } from '@/lib/security/audit'

const CRON_SECRET = process.env.CRON_SECRET || ''

function checkAuth(req: Request) {
  const header = req.headers.get('X-Cron-Secret') || ''
  return Boolean(CRON_SECRET) && timingSafeEqualString(header, CRON_SECRET)
}

async function runFromRequest(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = (searchParams.get('type') || 'DATABASE').toUpperCase() as BackupType

  if (!['DATABASE', 'MEDIA', 'FULL'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  const log = await runBackup(type)
  return NextResponse.json({ success: true, log })
}

export async function GET(req: Request) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  return runFromRequest(req)
}

export async function POST(req: Request) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const response = await runFromRequest(req)
  const payload = await response.clone().json().catch(() => null)
  await logAdminAudit({ req, session, action: 'BACKUP_RUN', entityType: 'backup', entityId: payload?.log?.id || null, meta: { type: new URL(req.url).searchParams.get('type') || 'database' } })
  return response
}
