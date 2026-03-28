import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const timestamp = new Date().toISOString()

  try {
    const [dbProbe, lastBackup, recentClientErrors] = await Promise.all([
      prisma.$queryRaw`SELECT 1;`,
      prisma.backupLog.findFirst({ orderBy: { createdAt: 'desc' } }),
      prisma.analyticsEvent.count({
        where: {
          eventType: 'CLIENT_ERROR',
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ])

    void dbProbe

    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      site: 'pagani.ro',
      timestamp,
      uptimeSeconds: Math.round(process.uptime()),
      backup: lastBackup
        ? {
            status: lastBackup.status,
            createdAt: lastBackup.createdAt.toISOString(),
          }
        : null,
      clientErrors24h: recentClientErrors,
    })
  } catch {
    return NextResponse.json(
      {
        status: 'error',
        db: 'disconnected',
        site: 'pagani.ro',
        timestamp,
        uptimeSeconds: Math.round(process.uptime()),
      },
      { status: 500 },
    )
  }
}