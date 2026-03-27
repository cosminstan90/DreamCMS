import { prisma } from '@/lib/prisma'

type RouteMetric = {
  route: string
  pageViews: number
  adImpressions: number
  adClicks: number
  affiliateClicks: number
  newsletterSignups: number
}

export type RevenueReport = {
  days: number
  from: string
  to: string
  totals: {
    pageViews: number
    adImpressions: number
    adClicks: number
    affiliateClicks: number
    newsletterSignups: number
    adCtr: number
    affiliateCtr: number
    newsletterCvr: number
    estimatedAdRevenue: number
    estimatedAffiliateRevenue: number
    estimatedLeadValue: number
    estimatedTotalRevenue: number
  }
  topRoutes: Array<RouteMetric & { estimatedRevenue: number }>
  topSources: Array<{ source: string; count: number }>
  topCampaigns: Array<{ campaign: string; count: number }>
}

function round2(value: number) {
  return Number(value.toFixed(2))
}

function byCount(items: Array<string | null>, keyName: 'source' | 'campaign') {
  const map = new Map<string, number>()
  for (const item of items) {
    const key = (item || 'direct').trim() || 'direct'
    map.set(key, (map.get(key) || 0) + 1)
  }
  return Array.from(map.entries())
    .map(([key, count]) => ({ [keyName]: key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10) as Array<{ source: string; count: number }> & Array<{ campaign: string; count: number }>
}

export async function generateRevenueReport(days = 30): Promise<RevenueReport> {
  const clampedDays = Math.min(365, Math.max(1, Math.floor(days)))
  const now = new Date()
  const since = new Date(now)
  since.setDate(now.getDate() - clampedDays)

  const [events, subscribers] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: { createdAt: { gte: since } },
      select: { route: true, eventType: true },
    }),
    prisma.newsletterSubscriber.findMany({
      where: {
        status: 'ACTIVE',
        lastSignupAt: { gte: since },
      },
      select: {
        utmSource: true,
        utmCampaign: true,
      },
      take: 5000,
    }),
  ])

  const routes = new Map<string, RouteMetric>()
  let pageViews = 0
  let adImpressions = 0
  let adClicks = 0
  let affiliateClicks = 0
  let newsletterSignups = 0

  for (const item of events) {
    const route = item.route || '/'
    if (!routes.has(route)) {
      routes.set(route, {
        route,
        pageViews: 0,
        adImpressions: 0,
        adClicks: 0,
        affiliateClicks: 0,
        newsletterSignups: 0,
      })
    }

    const current = routes.get(route)!
    if (item.eventType === 'PAGE_VIEW') {
      current.pageViews += 1
      pageViews += 1
    }
    if (item.eventType === 'AD_IMPRESSION') {
      current.adImpressions += 1
      adImpressions += 1
    }
    if (item.eventType === 'AD_CLICK') {
      current.adClicks += 1
      adClicks += 1
    }
    if (item.eventType === 'AFFILIATE_CLICK') {
      current.affiliateClicks += 1
      affiliateClicks += 1
    }
    if (item.eventType === 'NEWSLETTER_SIGNUP') {
      current.newsletterSignups += 1
      newsletterSignups += 1
    }
  }

  const adCtr = adImpressions ? round2((adClicks / adImpressions) * 100) : 0
  const affiliateCtr = pageViews ? round2((affiliateClicks / pageViews) * 100) : 0
  const newsletterCvr = pageViews ? round2((newsletterSignups / pageViews) * 100) : 0

  const estimatedAdRevenue = round2((adImpressions / 1000) * 2.5)
  const estimatedAffiliateRevenue = round2(affiliateClicks * 0.35)
  const estimatedLeadValue = round2(newsletterSignups * 0.2)
  const estimatedTotalRevenue = round2(estimatedAdRevenue + estimatedAffiliateRevenue + estimatedLeadValue)

  const topRoutes = Array.from(routes.values())
    .map((row) => {
      const routeRevenue = round2((row.adImpressions / 1000) * 2.5 + row.affiliateClicks * 0.35 + row.newsletterSignups * 0.2)
      return { ...row, estimatedRevenue: routeRevenue }
    })
    .sort((a, b) => b.estimatedRevenue - a.estimatedRevenue)
    .slice(0, 15)

  return {
    days: clampedDays,
    from: since.toISOString(),
    to: now.toISOString(),
    totals: {
      pageViews,
      adImpressions,
      adClicks,
      affiliateClicks,
      newsletterSignups,
      adCtr,
      affiliateCtr,
      newsletterCvr,
      estimatedAdRevenue,
      estimatedAffiliateRevenue,
      estimatedLeadValue,
      estimatedTotalRevenue,
    },
    topRoutes,
    topSources: byCount(subscribers.map((item) => item.utmSource), 'source') as Array<{ source: string; count: number }>,
    topCampaigns: byCount(subscribers.map((item) => item.utmCampaign), 'campaign') as Array<{ campaign: string; count: number }>,
  }
}
