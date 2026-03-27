import { AnalyticsEventType } from '@prisma/client'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const allowedTypes: AnalyticsEventType[] = [
  'PAGE_VIEW',
  'AD_IMPRESSION',
  'AD_CLICK',
  'AFFILIATE_CLICK',
  'SEARCH_USAGE',
  'NEWSLETTER_SIGNUP',
  'NEWSLETTER_VIEW',
  'OUTBOUND_CLICK',
  'WEB_VITAL',
  'CLIENT_ERROR',
]

function detectDeviceType(userAgent: string) {
  const ua = userAgent.toLowerCase()
  if (/mobile|android|iphone|ipod/.test(ua)) return 'mobile'
  if (/ipad|tablet/.test(ua)) return 'tablet'
  return 'desktop'
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const eventType = body.eventType as AnalyticsEventType
    if (!allowedTypes.includes(eventType)) {
      return NextResponse.json({ error: 'Invalid eventType' }, { status: 400 })
    }

    const route = typeof body.route === 'string' ? body.route : typeof body.pagePath === 'string' ? body.pagePath : ''
    if (!route) return NextResponse.json({ error: 'Missing route' }, { status: 400 })

    const userAgent = req.headers.get('user-agent') || ''
    await prisma.analyticsEvent.create({
      data: {
        eventType,
        route,
        templateType: typeof body.templateType === 'string' ? body.templateType : null,
        contentId: typeof body.contentId === 'string' ? body.contentId : null,
        referrer: typeof body.referrer === 'string' ? body.referrer : req.headers.get('referer'),
        deviceType: typeof body.deviceType === 'string' ? body.deviceType : detectDeviceType(userAgent),
        meta: body.meta && typeof body.meta === 'object' ? body.meta : null,
      },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}


