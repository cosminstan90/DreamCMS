import { mkdir, appendFile } from 'fs/promises'
import path from 'path'
import { NextResponse } from 'next/server'
import { AnalyticsEventType } from '@prisma/client'
import { prisma } from '@/lib/prisma'

function toAnalyticsType(eventType: string): AnalyticsEventType {
  return eventType === 'click' ? 'AD_CLICK' : 'AD_IMPRESSION'
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const payload = {
      eventType: body.eventType,
      route: body.route,
      slotKey: body.slotKey,
      pagePath: body.pagePath,
      provider: body.provider,
      createdAt: new Date().toISOString(),
    }

    try {
      await prisma.analyticsEvent.create({
        data: {
          eventType: toAnalyticsType(String(body.eventType || 'impression')),
          route: typeof body.pagePath === 'string' ? body.pagePath : typeof body.route === 'string' ? body.route : '/',
          templateType: typeof body.route === 'string' ? body.route : 'frontend',
          meta: {
            slotKey: body.slotKey,
            provider: body.provider,
          },
        },
      })
    } catch {
      // keep file fallback regardless of db state
    }

    const dir = path.join(process.cwd(), '.data')
    await mkdir(dir, { recursive: true })
    await appendFile(path.join(dir, 'ad-events.ndjson'), `${JSON.stringify(payload)}\n`, 'utf8')

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
