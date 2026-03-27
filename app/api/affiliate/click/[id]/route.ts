import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function detectDeviceType(userAgent: string) {
  const ua = userAgent.toLowerCase()
  if (/mobile|android|iphone|ipod/.test(ua)) return 'mobile'
  if (/ipad|tablet/.test(ua)) return 'tablet'
  return 'desktop'
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url)
  const pagePath = searchParams.get('page') || ''
  const templateType = searchParams.get('template') || ''
  const to = searchParams.get('to') || ''
  const referrer = req.headers.get('referer') || ''

  if (!to) {
    return NextResponse.json({ error: 'Missing redirect url' }, { status: 400 })
  }

  const product = await prisma.affiliateProduct.findUnique({
    where: { id: params.id },
    select: { affiliateUrl: true, active: true },
  })

  if (!product?.active) {
    return NextResponse.json({ error: 'Inactive affiliate target' }, { status: 404 })
  }

  try {
    await prisma.affiliateClickLog.create({
      data: {
        productId: params.id,
        pagePath,
        templateType,
        referrer,
      },
    })

    await prisma.analyticsEvent.create({
      data: {
        eventType: 'AFFILIATE_CLICK',
        route: pagePath || '/',
        templateType: templateType || null,
        contentId: params.id,
        referrer,
        deviceType: detectDeviceType(req.headers.get('user-agent') || ''),
        meta: { destination: product.affiliateUrl },
      },
    })
  } catch {
    // non-blocking by design
  }

  try {
    const target = new URL(product.affiliateUrl)
    return NextResponse.redirect(target, { status: 307 })
  } catch {
    return NextResponse.json({ error: 'Invalid redirect url' }, { status: 400 })
  }
}
