import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNewsletterWelcomeEmail } from '@/lib/notifications/newsletter-service'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type AttributionInput = {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  firstReferrer?: string
  landingPath?: string
}

function clean(value: unknown) {
  if (typeof value !== 'string') return null
  const v = value.trim()
  return v || null
}

function parseAttribution(value: unknown): AttributionInput | null {
  if (!value || typeof value !== 'object') return null
  const item = value as AttributionInput
  return {
    utmSource: clean(item.utmSource) || undefined,
    utmMedium: clean(item.utmMedium) || undefined,
    utmCampaign: clean(item.utmCampaign) || undefined,
    utmContent: clean(item.utmContent) || undefined,
    utmTerm: clean(item.utmTerm) || undefined,
    firstReferrer: clean(item.firstReferrer) || undefined,
    landingPath: clean(item.landingPath) || undefined,
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const rawEmail = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const rawName = typeof body?.name === 'string' ? body.name.trim() : ''
    const sourcePath = typeof body?.sourcePath === 'string' ? body.sourcePath.trim() : '/'
    const variant = typeof body?.variant === 'string' ? body.variant.trim().toUpperCase() : null
    const attribution = parseAttribution(body?.attribution)

    if (!rawEmail || !EMAIL_REGEX.test(rawEmail)) {
      return NextResponse.json({ error: 'Email invalid' }, { status: 400 })
    }

    const existed = await prisma.newsletterSubscriber.findUnique({ where: { email: rawEmail }, select: { id: true } })

    const subscriber = await prisma.newsletterSubscriber.upsert({
      where: { email: rawEmail },
      update: {
        name: rawName || undefined,
        status: 'ACTIVE',
        sourcePath: sourcePath || '/',
        utmSource: attribution?.utmSource,
        utmMedium: attribution?.utmMedium,
        utmCampaign: attribution?.utmCampaign,
        utmContent: attribution?.utmContent,
        utmTerm: attribution?.utmTerm,
        firstReferrer: attribution?.firstReferrer,
        lastReferrer: clean(req.headers.get('referer')),
        lastVariant: variant === 'B' ? 'B' : 'A',
        lastSignupAt: new Date(),
        signupCount: { increment: 1 },
      },
      create: {
        email: rawEmail,
        name: rawName || null,
        status: 'ACTIVE',
        sourcePath: sourcePath || '/',
        utmSource: attribution?.utmSource || null,
        utmMedium: attribution?.utmMedium || null,
        utmCampaign: attribution?.utmCampaign || null,
        utmContent: attribution?.utmContent || null,
        utmTerm: attribution?.utmTerm || null,
        firstReferrer: attribution?.firstReferrer || clean(req.headers.get('referer')),
        lastReferrer: clean(req.headers.get('referer')),
        lastVariant: variant === 'B' ? 'B' : 'A',
      },
      select: {
        id: true,
        email: true,
        status: true,
      },
    })

    await prisma.analyticsEvent.create({
      data: {
        eventType: 'NEWSLETTER_SIGNUP',
        route: sourcePath || '/',
        templateType: 'newsletter',
        contentId: subscriber.id,
        referrer: req.headers.get('referer') || null,
        meta: {
          variant: variant === 'B' ? 'B' : 'A',
          attribution,
        },
      },
    })

    if (!existed) {
      void sendNewsletterWelcomeEmail(rawEmail, rawName || null)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Nu s-a putut inregistra abonarea' }, { status: 500 })
  }
}
