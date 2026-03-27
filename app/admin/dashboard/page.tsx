import { prisma } from '@/lib/prisma'
import { DashboardClient } from '@/components/admin/DashboardClient'
import { countInternalLinks, hasFaqBlock } from '@/lib/seo/content-audit'
import { getObservabilityReport } from '@/lib/observability/report'

export const dynamic = 'force-dynamic'

type RouteMetric = {
  route: string
  pageViews: number
  adImpressions: number
  adClicks: number
  affiliateClicks: number
  searchUsage: number
  newsletterSignups: number
}

type AnalyticsEventInput = {
  route: string
  eventType: string
  meta: unknown
}

function buildRouteMetrics(events: Array<{ route: string; eventType: string }>): RouteMetric[] {
  const map = new Map<string, RouteMetric>()

  for (const event of events) {
    const route = event.route || '/'
    if (!map.has(route)) {
      map.set(route, {
        route,
        pageViews: 0,
        adImpressions: 0,
        adClicks: 0,
        affiliateClicks: 0,
        searchUsage: 0,
        newsletterSignups: 0,
      })
    }

    const current = map.get(route)!
    if (event.eventType === 'PAGE_VIEW') current.pageViews += 1
    if (event.eventType === 'AD_IMPRESSION') current.adImpressions += 1
    if (event.eventType === 'AD_CLICK') current.adClicks += 1
    if (event.eventType === 'AFFILIATE_CLICK') current.affiliateClicks += 1
    if (event.eventType === 'SEARCH_USAGE') current.searchUsage += 1
    if (event.eventType === 'NEWSLETTER_SIGNUP') current.newsletterSignups += 1
  }

  return Array.from(map.values())
}

function getVariant(meta: unknown): 'A' | 'B' | null {
  if (!meta || typeof meta !== 'object') return null
  const v = (meta as { variant?: unknown }).variant
  if (v === 'A' || v === 'B') return v
  return null
}

function daysSince(date: Date | null | undefined) {
  if (!date) return 999
  const diff = Date.now() - date.getTime()
  return Math.max(0, Math.round(diff / 86400000))
}

function getSymbolSchemaObject(schemaMarkup: unknown) {
  if (!schemaMarkup || typeof schemaMarkup !== 'object' || Array.isArray(schemaMarkup)) return {}
  return schemaMarkup as Record<string, unknown>
}

export default async function DashboardPage() {
  const since = new Date()
  since.setDate(since.getDate() - 30)

  const [postCount, publishedCount, symbolCount, mediaCount, lastBackup, recentPosts, publishedPosts, publishedSymbols, events, newsletterTotal, newsletterLast30, observabilityReport] = await Promise.all([
    prisma.post.count(),
    prisma.post.count({ where: { status: 'PUBLISHED' } }),
    prisma.symbolEntry.count(),
    prisma.media.count(),
    prisma.backupLog.findFirst({ orderBy: { createdAt: 'desc' } }),
    prisma.post.findMany({ orderBy: { updatedAt: 'desc' }, take: 10, select: { id: true, title: true, slug: true, postType: true, status: true, updatedAt: true } }),
    prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        slug: true,
        postType: true,
        metaTitle: true,
        metaDescription: true,
        focusKeyword: true,
        geoScore: true,
        directAnswer: true,
        contentHtml: true,
        contentJson: true,
        contentDecayScore: true,
        contentHealthScore: true,
        refreshPriority: true,
        refreshStatus: true,
        lastReviewedAt: true,
        updatedAt: true,
        publishedAt: true,
        category: { select: { slug: true, name: true } },
      },
    }),
    prisma.symbolEntry.findMany({
      where: { publishedAt: { not: null } },
      select: {
        id: true,
        name: true,
        slug: true,
        letter: true,
        geoScore: true,
        contentJson: true,
        schemaMarkup: true,
      },
    }),
    prisma.analyticsEvent.findMany({
      where: { createdAt: { gte: since } },
      select: { route: true, eventType: true, meta: true },
    }),
    prisma.newsletterSubscriber.count({ where: { status: 'ACTIVE' } }),
    prisma.newsletterSubscriber.count({ where: { status: 'ACTIVE', createdAt: { gte: since } } }),
    getObservabilityReport(7),
  ])

  const published = await prisma.post.findMany({
    where: { status: 'PUBLISHED', publishedAt: { gte: since } },
    select: { publishedAt: true },
  })

  const activityMap: Record<string, number> = {}
  for (let i = 0; i < 30; i += 1) {
    const d = new Date(since)
    d.setDate(since.getDate() + i)
    activityMap[d.toISOString().slice(0, 10)] = 0
  }

  for (const item of published) {
    if (!item.publishedAt) continue
    const key = item.publishedAt.toISOString().slice(0, 10)
    if (activityMap[key] !== undefined) activityMap[key] += 1
  }

  const activity = Object.entries(activityMap).map(([date, count]) => ({ date: date.slice(5), count }))

  const avgSeoScore = publishedPosts.length
    ? Math.round(
        publishedPosts.reduce((acc, post) => {
          let score = 0
          if (post.metaTitle) score += 25
          if (post.metaDescription) score += 25
          if (post.focusKeyword) score += 20
          if (countInternalLinks(post.contentHtml || '') >= 2) score += 15
          if (hasFaqBlock(post.contentJson)) score += 15
          return acc + score
        }, 0) / publishedPosts.length,
      )
    : 0

  const avgGeoScore = publishedPosts.length
    ? Math.round(publishedPosts.reduce((acc, p) => acc + (p.geoScore || 0), 0) / publishedPosts.length)
    : 0

  const internalLinkRows = publishedPosts
    .map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      categorySlug: post.category?.slug || null,
      linkCount: countInternalLinks(post.contentHtml || ''),
    }))
    .sort((a, b) => a.linkCount - b.linkCount)

  const noInternalLinksCount = internalLinkRows.filter((row) => row.linkCount === 0).length
  const missingMetaDescription = publishedPosts.filter((p) => !p.metaDescription).length
  const missingFocusKeyword = publishedPosts.filter((p) => !p.focusKeyword).length
  const missingInternalLinks = internalLinkRows.filter((row) => row.linkCount < 2).length
  const missingFaq = publishedPosts.filter((p) => !hasFaqBlock(p.contentJson)).length
  const missingDirectAnswer = publishedPosts.filter((p) => !p.directAnswer).length
  const lowGeoCount = publishedPosts.filter((p) => (p.geoScore || 0) < 50).length

  const linkOpportunities = publishedPosts
    .map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      categorySlug: post.category?.slug || null,
      links: countInternalLinks(post.contentHtml || ''),
      geoScore: post.geoScore || 0,
      hasFaq: hasFaqBlock(post.contentJson),
    }))
    .filter((post) => post.links < 2 || post.geoScore < 50 || !post.hasFaq)
    .sort((a, b) => a.links - b.links || a.geoScore - b.geoScore)
    .slice(0, 6)

  const geoTemplateAverages = [
    ...['ARTICLE', 'DREAM_INTERPRETATION'].map((template) => {
      const rows = publishedPosts.filter((post) => post.postType === template)
      return {
        template,
        avgGeo: rows.length ? Math.round(rows.reduce((acc, row) => acc + (row.geoScore || 0), 0) / rows.length) : 0,
        count: rows.length,
      }
    }),
    {
      template: 'SYMBOL',
      avgGeo: publishedSymbols.length ? Math.round(publishedSymbols.reduce((acc, row) => acc + (row.geoScore || 0), 0) / publishedSymbols.length) : 0,
      count: publishedSymbols.length,
    },
  ]

  const geoPageRows = [
    ...publishedPosts.map((post) => ({
      id: post.id,
      title: post.title,
      url: post.category?.slug ? `/${post.category.slug}/${post.slug}` : `/${post.slug}`,
      template: post.postType,
      geoScore: post.geoScore || 0,
      hasDirectAnswer: Boolean(post.directAnswer),
      hasFaq: hasFaqBlock(post.contentJson),
    })),
    ...publishedSymbols.map((symbol) => {
      const schema = getSymbolSchemaObject(symbol.schemaMarkup)
      return {
        id: symbol.id,
        title: symbol.name,
        url: `/dictionar/${symbol.letter}/${symbol.slug}`,
        template: 'SYMBOL',
        geoScore: symbol.geoScore || 0,
        hasDirectAnswer: Boolean(schema.directAnswer),
        hasFaq: hasFaqBlock(symbol.contentJson),
      }
    }),
  ]

  const geoReporting = {
    templateAverages: geoTemplateAverages,
    lowGeoPages: geoPageRows.filter((row) => row.geoScore < 50).sort((a, b) => a.geoScore - b.geoScore).slice(0, 8),
    pagesWithoutDirectAnswer: geoPageRows.filter((row) => !row.hasDirectAnswer).slice(0, 8),
    pagesWithoutFaq: geoPageRows.filter((row) => !row.hasFaq).slice(0, 8),
  }

  const refreshRows = publishedPosts
    .map((post) => ({
      id: post.id,
      title: post.title,
      url: post.category?.slug ? `/${post.category.slug}/${post.slug}` : `/${post.slug}`,
      refreshStatus: post.refreshStatus,
      refreshPriority: post.refreshPriority || 0,
      contentDecayScore: post.contentDecayScore || 0,
      contentHealthScore: post.contentHealthScore || 100,
      lastReviewedAt: post.lastReviewedAt ? post.lastReviewedAt.toISOString() : null,
      ageDays: daysSince(post.updatedAt || post.publishedAt),
    }))
    .sort((a, b) => b.refreshPriority - a.refreshPriority || b.contentDecayScore - a.contentDecayScore)

  const contentRefresh = {
    summary: {
      refreshNeeded: refreshRows.filter((row) => row.refreshStatus === 'REFRESH_NEEDED').length,
      watch: refreshRows.filter((row) => row.refreshStatus === 'WATCH').length,
      inRefresh: refreshRows.filter((row) => row.refreshStatus === 'IN_REFRESH').length,
      avgDecayScore: refreshRows.length ? Math.round(refreshRows.reduce((sum, row) => sum + row.contentDecayScore, 0) / refreshRows.length) : 0,
    },
    urgent: refreshRows.filter((row) => row.refreshPriority >= 60 || row.refreshStatus === 'IN_REFRESH').slice(0, 6),
  }

  const observability = {
    summary: observabilityReport.summary,
    poorPages: observabilityReport.poorPages.slice(0, 5),
    topErrors: observabilityReport.topErrors.slice(0, 5),
    metrics: observabilityReport.metrics,
  }

  const typedEvents = events as AnalyticsEventInput[]
  const routeMetrics = buildRouteMetrics(typedEvents)
  const totalPageViews = routeMetrics.reduce((acc, item) => acc + item.pageViews, 0)

  const variantViews = { A: 0, B: 0 }
  const variantSignups = { A: 0, B: 0 }
  for (const event of typedEvents) {
    const variant = getVariant(event.meta)
    if (!variant) continue
    if (event.eventType === 'NEWSLETTER_VIEW') variantViews[variant] += 1
    if (event.eventType === 'NEWSLETTER_SIGNUP') variantSignups[variant] += 1
  }

  const topAdPages = routeMetrics
    .filter((entry) => entry.adImpressions > 0)
    .sort((a, b) => b.adImpressions - a.adImpressions)
    .slice(0, 5)

  const topAffiliatePages = routeMetrics
    .filter((entry) => entry.affiliateClicks > 0)
    .sort((a, b) => b.affiliateClicks - a.affiliateClicks)
    .slice(0, 5)

  const revenueCandidates = routeMetrics
    .filter((entry) => entry.pageViews >= 3)
    .map((entry) => ({
      ...entry,
      opportunityScore: Math.round((entry.pageViews * 1.2 + entry.adImpressions * 0.3 + entry.searchUsage * 1.4 + entry.newsletterSignups * 3) - (entry.adClicks * 2 + entry.affiliateClicks * 4)),
    }))
    .sort((a, b) => b.opportunityScore - a.opportunityScore)
    .slice(0, 6)

  const totalNewsletterSignups = routeMetrics.reduce((acc, item) => acc + item.newsletterSignups, 0)
  const newsletterConversionRate = totalPageViews ? Number(((totalNewsletterSignups / totalPageViews) * 100).toFixed(2)) : 0

  const lowPerformingPages = routeMetrics
    .filter((entry) => entry.pageViews >= 5 && entry.adClicks + entry.affiliateClicks === 0)
    .sort((a, b) => b.pageViews - a.pageViews)
    .slice(0, 6)

  const lastBackupStatus = lastBackup?.status || 'N/A'
  const lastBackupBadge = lastBackupStatus === 'SUCCESS' ? 'bg-emerald-600' : lastBackupStatus === 'FAILED' ? 'bg-rose-600' : 'bg-slate-700'

  return (
    <section className="space-y-6">
      <div className="sticky top-0 z-10 bg-[#0f172a] py-3">
        <div className="flex items-center gap-2 text-slate-200">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          Site status: online
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4"><div className="text-xs text-slate-400">Total Articole</div><div className="text-2xl font-semibold text-white">{postCount}</div></div>
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4"><div className="text-xs text-slate-400">Publicate</div><div className="text-2xl font-semibold text-white">{publishedCount}</div></div>
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4"><div className="text-xs text-slate-400">Simboluri in Dictionar</div><div className="text-2xl font-semibold text-white">{symbolCount}</div></div>
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4"><div className="text-xs text-slate-400">Total Media</div><div className="text-2xl font-semibold text-white">{mediaCount}</div></div>
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4">
          <div className="text-xs text-slate-400">Ultima Backup</div>
          <div className="text-lg font-semibold text-white">{lastBackup ? new Date(lastBackup.createdAt).toLocaleDateString('ro-RO') : 'N/A'}</div>
          <span className={`mt-2 inline-flex rounded px-2 py-1 text-xs text-white ${lastBackupBadge}`}>{lastBackupStatus}</span>
        </div>
      </div>

      <DashboardClient
        activity={activity}
        recentPosts={recentPosts.map((post) => ({ ...post, updatedAt: post.updatedAt.toISOString() }))}
        seoHealth={{
          avgSeoScore,
          avgGeoScore,
          noInternalLinksCount,
          missingMetaDescription,
          missingFocusKeyword,
          missingInternalLinks,
          missingFaq,
          missingDirectAnswer,
          lowGeoCount,
        }}
        linkOpportunities={linkOpportunities}
        internalLinkOverview={{
          noLinkPages: internalLinkRows.filter((row) => row.linkCount === 0).slice(0, 5),
          topLinkedPages: [...internalLinkRows].sort((a, b) => b.linkCount - a.linkCount).slice(0, 5),
        }}
        geoReporting={geoReporting}
        contentRefresh={contentRefresh}
        observability={observability}
        monetization={{
          topAdPages,
          topAffiliatePages,
          revenueCandidates,
          lowPerformingPages,
          newsletter: {
            totalSubscribers: newsletterTotal,
            signupsLast30Days: newsletterLast30,
            conversionRate: newsletterConversionRate,
            variantAViews: variantViews.A,
            variantBViews: variantViews.B,
            variantASignups: variantSignups.A,
            variantBSignups: variantSignups.B,
          },
        }}
      />
    </section>
  )
}
