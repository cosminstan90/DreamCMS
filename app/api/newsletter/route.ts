import { NewsletterStatus, Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

function toCsvRow(values: Array<string | number | null>) {
  return values
    .map((value) => {
      const text = String(value ?? '')
      if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
      return text
    })
    .join(',')
}

function topCount(items: Array<string | null>, take = 8) {
  const map = new Map<string, number>()
  for (const item of items) {
    const key = (item || 'direct').trim() || 'direct'
    map.set(key, (map.get(key) || 0) + 1)
  }
  return Array.from(map.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, take)
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const url = new URL(req.url)
  const page = Math.max(1, Number(url.searchParams.get('page') || '1'))
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit') || '40')))
  const search = (url.searchParams.get('search') || '').trim()
  const statusRaw = (url.searchParams.get('status') || '').trim().toUpperCase()
  const format = (url.searchParams.get('format') || '').trim().toLowerCase()

  const status: NewsletterStatus | null =
    statusRaw === 'ACTIVE' ? 'ACTIVE' : statusRaw === 'UNSUBSCRIBED' ? 'UNSUBSCRIBED' : null

  const where: Prisma.NewsletterSubscriberWhereInput = {
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            { email: { contains: search } },
            { name: { contains: search } },
            { sourcePath: { contains: search } },
            { utmSource: { contains: search } },
            { utmCampaign: { contains: search } },
          ],
        }
      : {}),
  }

  if (format === 'csv') {
    const rows = await prisma.newsletterSubscriber.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        sourcePath: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        signupCount: true,
        createdAt: true,
        lastSignupAt: true,
      },
      take: 5000,
    })

    const csv = [
      'id,email,name,status,sourcePath,utmSource,utmMedium,utmCampaign,signupCount,createdAt,lastSignupAt',
      ...rows.map((row) =>
        toCsvRow([
          row.id,
          row.email,
          row.name,
          row.status,
          row.sourcePath,
          row.utmSource,
          row.utmMedium,
          row.utmCampaign,
          row.signupCount,
          row.createdAt.toISOString(),
          row.lastSignupAt.toISOString(),
        ]),
      ),
    ].join('\n')

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="newsletter-subscribers.csv"',
      },
    })
  }

  const skip = (page - 1) * limit
  const [data, total, statsRows] = await Promise.all([
    prisma.newsletterSubscriber.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.newsletterSubscriber.count({ where }),
    prisma.newsletterSubscriber.findMany({
      where: { status: 'ACTIVE' },
      select: { utmSource: true, utmCampaign: true, firstReferrer: true },
      take: 3000,
    }),
  ])

  const stats = {
    bySource: topCount(statsRows.map((item) => item.utmSource)),
    byCampaign: topCount(statsRows.map((item) => item.utmCampaign)),
    byReferrer: topCount(statsRows.map((item) => item.firstReferrer)),
  }

  return NextResponse.json({ data, page, limit, total, pages: Math.ceil(total / limit), stats })
}
