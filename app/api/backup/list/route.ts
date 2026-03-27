import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/security/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function formatSize(bytes: number | null | undefined) {
  if (!bytes) return 'n/a'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export async function GET() {
  const { response } = await requireRole('ADMIN')
  if (response) return response

  try {
    const logs = await prisma.backupLog.findMany({ orderBy: { createdAt: 'desc' }, take: 200 })
    return NextResponse.json({
      data: logs.map((log) => ({
        ...log,
        fileSizeFormatted: formatSize(log.fileSize),
      })),
    })
  } catch {
    return NextResponse.json({ data: [] })
  }
}
