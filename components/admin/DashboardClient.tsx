'use client'

import Link from 'next/link'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

type ActivityPoint = { date: string; count: number }

type RecentPost = { id: string; title: string; slug: string; postType: string; status: string; updatedAt: string }

type LinkOpportunity = {
  id: string
  title: string
  slug: string
  categorySlug: string | null
  links: number
  geoScore: number
  hasFaq: boolean
}

type InternalLinkRow = {
  id: string
  title: string
  slug: string
  categorySlug: string | null
  linkCount: number
}

type GeoTemplateRow = {
  template: string
  avgGeo: number
  count: number
}

type GeoPageRow = {
  id: string
  title: string
  url: string
  template: string
  geoScore: number
  hasDirectAnswer: boolean
  hasFaq: boolean
}

type RefreshDashboardRow = {
  id: string
  title: string
  url: string
  refreshStatus: string
  refreshPriority: number
  contentDecayScore: number
  contentHealthScore: number
  lastReviewedAt: string | null
  ageDays: number
}

type ObservabilityMetricRow = {
  metric: string
  samples: number
  average: number
  p75: number
  good: number
  needsImprovement: number
  poor: number
}

type ObservabilityPageRow = {
  route: string
  pageViews: number
  score: number
  poorEvents: number
  needsImprovementEvents: number
  samples: number
  metrics: Array<{ metric: string; poor: number; needsImprovement: number; average: number }>
}

type ObservabilityErrorRow = {
  route: string
  message: string
  count: number
  lastSeen: string
}

type MetricRow = {
  route: string
  pageViews: number
  adImpressions: number
  adClicks: number
  affiliateClicks: number
  searchUsage: number
  newsletterSignups: number
}

type CandidateRow = MetricRow & { opportunityScore: number }

type DashboardClientProps = {
  activity: ActivityPoint[]
  recentPosts: RecentPost[]
  seoHealth: {
    avgSeoScore: number
    avgGeoScore: number
    noInternalLinksCount: number
    missingMetaDescription: number
    missingFocusKeyword: number
    missingInternalLinks: number
    missingFaq: number
    missingDirectAnswer: number
    lowGeoCount: number
  }
  linkOpportunities: LinkOpportunity[]
  internalLinkOverview: {
    noLinkPages: InternalLinkRow[]
    topLinkedPages: InternalLinkRow[]
  }
  geoReporting: {
    templateAverages: GeoTemplateRow[]
    lowGeoPages: GeoPageRow[]
    pagesWithoutDirectAnswer: GeoPageRow[]
    pagesWithoutFaq: GeoPageRow[]
  }
  contentRefresh: {
    summary: {
      refreshNeeded: number
      watch: number
      inRefresh: number
      avgDecayScore: number
    }
    urgent: RefreshDashboardRow[]
  }
  observability: {
    summary: {
      days: number
      totalVitalSamples: number
      totalClientErrors: number
      totalPoor: number
      totalNeedsImprovement: number
      avgScore: number
    }
    poorPages: ObservabilityPageRow[]
    topErrors: ObservabilityErrorRow[]
    metrics: ObservabilityMetricRow[]
  }
  monetization: {
    topAdPages: MetricRow[]
    topAffiliatePages: MetricRow[]
    revenueCandidates: CandidateRow[]
    lowPerformingPages: MetricRow[]
    newsletter: {
      totalSubscribers: number
      signupsLast30Days: number
      conversionRate: number
      variantAViews: number
      variantBViews: number
      variantASignups: number
      variantBSignups: number
    }
  }
}

export function DashboardClient({
  activity,
  recentPosts,
  seoHealth,
  linkOpportunities,
  internalLinkOverview,
  geoReporting,
  contentRefresh,
  observability,
  monetization,
}: DashboardClientProps) {
  const cvrA = monetization.newsletter.variantAViews
    ? ((monetization.newsletter.variantASignups / monetization.newsletter.variantAViews) * 100).toFixed(2)
    : '0.00'
  const cvrB = monetization.newsletter.variantBViews
    ? ((monetization.newsletter.variantBSignups / monetization.newsletter.variantBViews) * 100).toFixed(2)
    : '0.00'

  return (
    <>
      <div className="space-y-4 rounded-xl border border-slate-700 bg-[#1e293b] p-6">
        <h2 className="text-lg font-semibold text-white">Publishing activity (last 30 days)</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activity}>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-slate-700 bg-[#1e293b] p-6">
          <h2 className="text-lg font-semibold text-white">Recent Posts</h2>
          <div className="space-y-2">
            {recentPosts.map((post) => (
              <div key={post.id} className="flex items-center justify-between border-b border-slate-700 pb-2 text-sm text-slate-200">
                <div>
                  <div className="font-medium">{post.title}</div>
                  <div className="text-xs text-slate-400">{post.postType} · {post.status}</div>
                </div>
                <div className="text-xs text-slate-400">{new Date(post.updatedAt).toLocaleDateString('ro-RO')}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-700 bg-[#1e293b] p-6">
          <h2 className="text-lg font-semibold text-white">SEO Health</h2>
          <div className="grid grid-cols-2 gap-4 text-sm text-slate-200">
            <div className="rounded-lg bg-slate-800 p-3">Avg SEO score: {seoHealth.avgSeoScore}</div>
            <div className="rounded-lg bg-slate-800 p-3">Avg GEO score: {seoHealth.avgGeoScore}</div>
            <div className="rounded-lg bg-slate-800 p-3">Fara metaDescription: {seoHealth.missingMetaDescription}</div>
            <div className="rounded-lg bg-slate-800 p-3">Fara focusKeyword: {seoHealth.missingFocusKeyword}</div>
            <div className="rounded-lg bg-slate-800 p-3">Fara internal links: {seoHealth.noInternalLinksCount}</div>
            <div className="rounded-lg bg-slate-800 p-3">Sub 2 internal links: {seoHealth.missingInternalLinks}</div>
            <div className="rounded-lg bg-slate-800 p-3">Fara FAQ: {seoHealth.missingFaq}</div>
            <div className="rounded-lg bg-slate-800 p-3">Fara direct answer: {seoHealth.missingDirectAnswer}</div>
            <div className="rounded-lg bg-slate-800 p-3">GEO &lt; 50: {seoHealth.lowGeoCount}</div>
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-700 bg-[#1e293b] p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">Linking Opportunities</h2>
          <Link href="/admin/posts" className="text-sm text-violet-300 hover:text-violet-200">Vezi toate articolele</Link>
        </div>
        <div className="space-y-2">
          {linkOpportunities.length === 0 && <div className="text-sm text-slate-400">Momentan nu exista oportunitati urgente.</div>}
          {linkOpportunities.map((post) => (
            <Link key={post.id} href={`/admin/posts/${post.id}`} className="flex items-center justify-between gap-4 rounded-lg border border-slate-700 bg-[#0f172a] p-3 text-sm text-slate-200 hover:border-violet-500">
              <div>
                <div className="font-medium">{post.title}</div>
                <div className="text-xs text-slate-400">{post.links} linkuri interne · GEO {post.geoScore} · FAQ {post.hasFaq ? 'da' : 'nu'}</div>
              </div>
              <span className="text-xs text-violet-300">Optimizeaza</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-slate-700 bg-[#1e293b] p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Pages fara internal links</h2>
            <Link href="/admin/seo" className="text-sm text-violet-300 hover:text-violet-200">Raport complet</Link>
          </div>
          <div className="space-y-2 text-sm text-slate-200">
            {internalLinkOverview.noLinkPages.length === 0 && <div className="text-slate-400">Toate paginile publicate au cel putin un link intern.</div>}
            {internalLinkOverview.noLinkPages.map((row) => (
              <div key={row.id} className="flex items-center justify-between border-b border-slate-700 pb-2">
                <span className="max-w-[70%] truncate">{row.title}</span>
                <span className="text-xs text-rose-300">0 linkuri</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-700 bg-[#1e293b] p-6">
          <h2 className="text-lg font-semibold text-white">Top Pages by Internal Link Count</h2>
          <div className="space-y-2 text-sm text-slate-200">
            {internalLinkOverview.topLinkedPages.length === 0 && <div className="text-slate-400">Nu exista date suficiente.</div>}
            {internalLinkOverview.topLinkedPages.map((row) => (
              <div key={row.id} className="flex items-center justify-between border-b border-slate-700 pb-2">
                <span className="max-w-[70%] truncate">{row.title}</span>
                <span className="text-xs text-emerald-300">{row.linkCount} linkuri</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-slate-700 bg-[#1e293b] p-6">
        <h2 className="text-lg font-semibold text-white">GEO Reporting</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {geoReporting.templateAverages.map((row) => (
            <div key={row.template} className="rounded-lg bg-slate-800 p-4 text-sm text-slate-200">
              <div className="text-xs text-slate-400">{row.template}</div>
              <div className="mt-2 text-2xl font-semibold text-white">{row.avgGeo}</div>
              <div className="text-xs text-slate-400">{row.count} pagini</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-2 rounded-xl border border-slate-700 bg-[#0f172a] p-4">
            <h3 className="font-semibold text-white">Pages cu GEO &lt; 50</h3>
            {geoReporting.lowGeoPages.length === 0 && <div className="text-sm text-slate-400">Nu exista pagini cu GEO critic.</div>}
            {geoReporting.lowGeoPages.map((row) => (
              <div key={row.id} className="border-b border-slate-700 pb-2 text-sm text-slate-200">
                <div className="font-medium">{row.title}</div>
                <div className="text-xs text-slate-400">{row.template} · {row.url}</div>
                <div className="text-xs text-rose-300">GEO {row.geoScore}</div>
              </div>
            ))}
          </div>
          <div className="space-y-2 rounded-xl border border-slate-700 bg-[#0f172a] p-4">
            <h3 className="font-semibold text-white">Pages fara direct answer</h3>
            {geoReporting.pagesWithoutDirectAnswer.length === 0 && <div className="text-sm text-slate-400">Toate paginile au direct answer.</div>}
            {geoReporting.pagesWithoutDirectAnswer.map((row) => (
              <div key={row.id} className="border-b border-slate-700 pb-2 text-sm text-slate-200">
                <div className="font-medium">{row.title}</div>
                <div className="text-xs text-slate-400">{row.template} · {row.url}</div>
              </div>
            ))}
          </div>
          <div className="space-y-2 rounded-xl border border-slate-700 bg-[#0f172a] p-4">
            <h3 className="font-semibold text-white">Pages fara FAQ</h3>
            {geoReporting.pagesWithoutFaq.length === 0 && <div className="text-sm text-slate-400">Toate paginile au FAQ.</div>}
            {geoReporting.pagesWithoutFaq.map((row) => (
              <div key={row.id} className="border-b border-slate-700 pb-2 text-sm text-slate-200">
                <div className="font-medium">{row.title}</div>
                <div className="text-xs text-slate-400">{row.template} · {row.url}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-slate-700 bg-[#1e293b] p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">Content Refresh Queue</h2>
          <Link href="/admin/refresh" className="text-sm text-violet-300 hover:text-violet-200">Open refresh ops</Link>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-slate-800 p-3 text-sm text-slate-200">Refresh needed: {contentRefresh.summary.refreshNeeded}</div>
          <div className="rounded-lg bg-slate-800 p-3 text-sm text-slate-200">Watch: {contentRefresh.summary.watch}</div>
          <div className="rounded-lg bg-slate-800 p-3 text-sm text-slate-200">In refresh: {contentRefresh.summary.inRefresh}</div>
          <div className="rounded-lg bg-slate-800 p-3 text-sm text-slate-200">Avg decay: {contentRefresh.summary.avgDecayScore}</div>
        </div>
        <div className="space-y-2 text-sm text-slate-200">
          {contentRefresh.urgent.length === 0 && <div className="text-slate-400">Nu exista refresh-uri urgente.</div>}
          {contentRefresh.urgent.map((row) => (
            <Link key={row.id} href={`/admin/posts/${row.id}`} className="flex items-center justify-between gap-4 rounded-lg border border-slate-700 bg-[#0f172a] p-3 hover:border-violet-500">
              <div>
                <div className="font-medium">{row.title}</div>
                <div className="text-xs text-slate-400">{row.refreshStatus} - priority {row.refreshPriority} - decay {row.contentDecayScore} - age {row.ageDays} zile</div>
              </div>
              <span className="text-xs text-violet-300">Refresh</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="space-y-4 rounded-xl border border-slate-700 bg-[#1e293b] p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">Observability Snapshot</h2>
          <Link href="/admin/observability" className="text-sm text-violet-300 hover:text-violet-200">Open observability</Link>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-slate-800 p-3 text-sm text-slate-200">Vital samples: {observability.summary.totalVitalSamples}</div>
          <div className="rounded-lg bg-slate-800 p-3 text-sm text-slate-200">Client errors: {observability.summary.totalClientErrors}</div>
          <div className="rounded-lg bg-slate-800 p-3 text-sm text-slate-200">Poor vitals: {observability.summary.totalPoor}</div>
          <div className="rounded-lg bg-slate-800 p-3 text-sm text-slate-200">Avg route score: {observability.summary.avgScore}</div>
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="space-y-2 text-sm text-slate-200">
            <div className="text-sm font-medium text-white">Worst pages</div>
            {observability.poorPages.length === 0 && <div className="text-slate-400">Nu exista suficiente date de Web Vitals inca.</div>}
            {observability.poorPages.map((row) => (
              <div key={row.route} className="rounded-lg border border-slate-700 bg-[#0f172a] p-3">
                <div className="font-medium text-white">{row.route}</div>
                <div className="text-xs text-slate-400">score {row.score} · poor {row.poorEvents} · PV {row.pageViews}</div>
              </div>
            ))}
          </div>
          <div className="space-y-2 text-sm text-slate-200">
            <div className="text-sm font-medium text-white">Top client errors</div>
            {observability.topErrors.length === 0 && <div className="text-slate-400">Nu exista erori client in perioada curenta.</div>}
            {observability.topErrors.map((row, index) => (
              <div key={`${index}-${row.route}`} className="rounded-lg border border-slate-700 bg-[#0f172a] p-3">
                <div className="font-medium text-white">{row.message}</div>
                <div className="text-xs text-slate-400">{row.route} · {row.count}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          {observability.metrics.map((metric) => (
            <div key={metric.metric} className="rounded-lg bg-[#0f172a] p-3 text-sm text-slate-200">
              <div className="text-xs text-slate-400">{metric.metric}</div>
              <div className="mt-1 text-lg font-semibold text-white">{metric.p75}{metric.metric === 'CLS' ? '' : 'ms'}</div>
              <div className="text-xs text-slate-400">p75 · poor {metric.poor}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-slate-700 bg-[#1e293b] p-6">
          <h2 className="text-lg font-semibold text-white">Top Ad Pages</h2>
          <div className="space-y-2 text-sm text-slate-200">
            {monetization.topAdPages.length === 0 && <div className="text-slate-400">Nu exista impresii ads inca.</div>}
            {monetization.topAdPages.map((row) => (
              <div key={row.route} className="flex items-center justify-between border-b border-slate-700 pb-2">
                <span className="max-w-[70%] truncate">{row.route}</span>
                <span className="text-xs text-slate-400">{row.adImpressions} imp · {row.adClicks} click</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-slate-700 bg-[#1e293b] p-6">
          <h2 className="text-lg font-semibold text-white">Top Affiliate Pages</h2>
          <div className="space-y-2 text-sm text-slate-200">
            {monetization.topAffiliatePages.length === 0 && <div className="text-slate-400">Nu exista clickuri affiliate inca.</div>}
            {monetization.topAffiliatePages.map((row) => (
              <div key={row.route} className="flex items-center justify-between border-b border-slate-700 pb-2">
                <span className="max-w-[70%] truncate">{row.route}</span>
                <span className="text-xs text-slate-400">{row.affiliateClicks} clickuri</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-700 bg-[#1e293b] p-6">
        <h2 className="text-lg font-semibold text-white">Top Revenue Candidates</h2>
        <div className="space-y-2 text-sm text-slate-200">
          {monetization.revenueCandidates.length === 0 && <div className="text-slate-400">Date insuficiente pentru candidati.</div>}
          {monetization.revenueCandidates.map((row) => (
            <div key={row.route} className="flex items-center justify-between border-b border-slate-700 pb-2">
              <span className="max-w-[70%] truncate">{row.route}</span>
              <span className="text-xs text-slate-400">score {row.opportunityScore} · PV {row.pageViews} · Search {row.searchUsage} · Leads {row.newsletterSignups}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-700 bg-[#1e293b] p-6">
        <h2 className="text-lg font-semibold text-white">Low Performing Pages</h2>
        <div className="space-y-2 text-sm text-slate-200">
          {monetization.lowPerformingPages.length === 0 && <div className="text-slate-400">Nu exista pagini slab monetizate in setul curent.</div>}
          {monetization.lowPerformingPages.map((row) => (
            <div key={row.route} className="flex items-center justify-between border-b border-slate-700 pb-2">
              <span className="max-w-[70%] truncate">{row.route}</span>
              <span className="text-xs text-slate-400">PV {row.pageViews} · leads {row.newsletterSignups} · monetizare 0</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-700 bg-[#1e293b] p-6">
        <h2 className="text-lg font-semibold text-white">Newsletter Funnel</h2>
        <div className="grid grid-cols-1 gap-3 text-sm text-slate-200 md:grid-cols-3">
          <div className="rounded-lg bg-slate-800 p-3">Abonati activi: {monetization.newsletter.totalSubscribers}</div>
          <div className="rounded-lg bg-slate-800 p-3">Signups 30 zile: {monetization.newsletter.signupsLast30Days}</div>
          <div className="rounded-lg bg-slate-800 p-3">CVR signup: {monetization.newsletter.conversionRate}%</div>
        </div>
        <div className="grid grid-cols-1 gap-3 text-sm text-slate-200 md:grid-cols-2">
          <div className="rounded-lg bg-slate-800 p-3">A/B A: {monetization.newsletter.variantASignups} / {monetization.newsletter.variantAViews} ({cvrA}%)</div>
          <div className="rounded-lg bg-slate-800 p-3">A/B B: {monetization.newsletter.variantBSignups} / {monetization.newsletter.variantBViews} ({cvrB}%)</div>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-700 bg-[#1e293b] p-6">
        <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link className="rounded-lg bg-[#8b5cf6] px-4 py-2 text-white" href="/admin/posts/new">Articol Nou</Link>
          <Link className="rounded-lg bg-[#8b5cf6] px-4 py-2 text-white" href="/admin/symbols/new">Simbol Nou</Link>
          <Link className="rounded-lg bg-[#8b5cf6] px-4 py-2 text-white" href="/admin/media">Upload Media</Link>
          <Link className="rounded-lg bg-[#8b5cf6] px-4 py-2 text-white" href="/admin/topics">Topic Authority</Link>
          <Link className="rounded-lg bg-[#8b5cf6] px-4 py-2 text-white" href="/admin/refresh">Refresh Queue</Link>
          <Link className="rounded-lg bg-[#8b5cf6] px-4 py-2 text-white" href="/admin/observability">Observability</Link>
          <Link className="rounded-lg bg-[#8b5cf6] px-4 py-2 text-white" href="/admin/growth">Growth Intel</Link>
          <Link className="rounded-lg bg-slate-700 px-4 py-2 text-slate-100" href="/admin/affiliate">Manage Affiliate</Link>
        </div>
      </div>
    </>
  )
}