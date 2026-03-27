'use client'

import { useEffect, useMemo, useState } from 'react'

type ClusterRow = {
  id: string
  name: string
  slug: string
  priority: string
  status: string
  description: string | null
  pillarTitle: string | null
  pillarPost: { id: string; title: string; slug: string; category?: { slug: string } | null } | null
  category?: { name: string; slug: string } | null
  _count: { posts: number; opportunities: number; briefs: number; keywords: number }
}

type OpportunityRow = {
  id: string
  name: string
  slug: string
  status: string
  priority: string
  opportunityType: string | null
  summary: string | null
  recommendedTitle: string | null
  recommendedMeta: string | null
  cluster?: { name: string; slug: string } | null
  category?: { name: string; slug: string } | null
  symbol?: { name: string; slug: string; letter: string } | null
  post?: { title: string; slug: string; category?: { slug: string } | null } | null
}

type BriefRow = {
  id: string
  name: string
  slug: string
  title: string | null
  metaTitle: string | null
  metaDescription: string | null
  outline: Array<{ heading: string; goal: string }> | null
  faq: Array<{ question: string; answer: string }> | null
  internalLinks: Array<{ label: string; url: string; type: string }> | null
  geoBlocks: string[] | null
  monetizationNotes: string | null
  updatedAt: string
  opportunity?: { name: string; status: string } | null
}

type Report = {
  summary: { clusters: number; opportunities: number; orphanContent: number; missingSupportPages: number }
  queue: Array<{ status: string; count: number }>
  clusterCoverage: Array<{ id: string; name: string; slug: string; coverageScore: number; publishedSupportCount: number; keywordCount: number; opportunityCount: number; hasHub: boolean; hubUrl: string | null }>
  orphanContent: Array<{ id: string; title: string; url: string }>
  missingSupportPages: Array<{ type: string; label: string }>
  topOpportunities: Array<{ id: string; name: string; status: string; type: string | null; score: number; cluster: string | null; category: string | null; targetUrl: string | null }>
  gaps: {
    weakSymbols: Array<{ id: string; name: string; url: string; geoScore: number }>
    underdevelopedCategories: Array<{ id: string; name: string; slug: string; publishedCount: number }>
    pagesMissingSupport: Array<{ id: string; title: string; url: string; linkCount: number; hasFaq: boolean; hasSchema: boolean }>
  }
}

const WORKFLOW_OPTIONS = ['READY_TO_WRITE', 'IN_PROGRESS', 'PUBLISHED', 'REFRESH_NEEDED', 'DISMISSED']

export const dynamic = 'force-dynamic'

export default function TopicsAdminPage() {
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [topics, setTopics] = useState<{ clusters: ClusterRow[]; opportunities: OpportunityRow[]; briefs: BriefRow[] }>({ clusters: [], opportunities: [], briefs: [] })
  const [report, setReport] = useState<Report | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [activeBriefId, setActiveBriefId] = useState<string | null>(null)

  async function loadData() {
    setLoading(true)
    try {
      const [topicsRes, reportRes] = await Promise.all([fetch('/api/topics'), fetch('/api/topics/report')])
      const [topicsJson, reportJson] = await Promise.all([topicsRes.json(), reportRes.json()])
      setTopics({
        clusters: Array.isArray(topicsJson.clusters) ? topicsJson.clusters : [],
        opportunities: Array.isArray(topicsJson.opportunities) ? topicsJson.opportunities : [],
        briefs: Array.isArray(topicsJson.briefs) ? topicsJson.briefs : [],
      })
      setReport(reportJson)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const activeBrief = useMemo(
    () => topics.briefs.find((brief) => brief.id === activeBriefId) || topics.briefs[0] || null,
    [activeBriefId, topics.briefs],
  )

  async function syncAuthority() {
    setSyncing(true)
    setStatusMessage(null)
    try {
      const res = await fetch('/api/topics/bootstrap', { method: 'POST' })
      const json = await res.json()
      setStatusMessage(json.success ? `Topical authority sincronizat. Oportunitati active: ${json.totalOpportunities}.` : 'Sincronizarea a esuat.')
      await loadData()
    } finally {
      setSyncing(false)
    }
  }

  async function createHub(clusterId: string) {
    setStatusMessage(null)
    const res = await fetch(`/api/topics/clusters/${clusterId}/hub`, { method: 'POST' })
    const json = await res.json()
    if (json?.post?.id) {
      window.location.href = `/admin/posts/${json.post.id}`
      return
    }
    setStatusMessage(json.error || 'Nu am putut crea hub draft-ul.')
  }

  async function generateBrief(opportunityId: string) {
    setStatusMessage(null)
    const res = await fetch(`/api/topics/opportunities/${opportunityId}/brief`, { method: 'POST' })
    const json = await res.json()
    if (json.success) {
      await loadData()
      if (json.brief?.id) setActiveBriefId(json.brief.id)
      setStatusMessage('Brief generat si salvat.')
      return
    }
    setStatusMessage(json.error || 'Nu am putut genera brief-ul.')
  }

  async function updateOpportunityStatus(opportunityId: string, status: string) {
    await fetch(`/api/topics/opportunities/${opportunityId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await loadData()
  }

  if (loading) {
    return <div className="text-slate-300">Se incarca sistemul editorial...</div>
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-slate-700 bg-[#1e293b] p-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Topical Authority & Editorial Ops</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Aici editorii gasesc hub-urile prioritare, oportunitatile de continut, gap-urile SEO/GEO si brief-urile gata de scris.
          </p>
        </div>
        <button
          type="button"
          onClick={syncAuthority}
          className="rounded-lg bg-[#8b5cf6] px-4 py-2 text-sm font-medium text-white"
        >
          {syncing ? 'Sincronizam...' : 'Sync hubs, gaps & opportunities'}
        </button>
      </div>

      {statusMessage && <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-sm text-violet-100">{statusMessage}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4"><div className="text-xs text-slate-400">Clusters</div><div className="mt-2 text-2xl font-semibold text-white">{report?.summary.clusters || 0}</div></div>
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4"><div className="text-xs text-slate-400">Opportunities</div><div className="mt-2 text-2xl font-semibold text-white">{report?.summary.opportunities || 0}</div></div>
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4"><div className="text-xs text-slate-400">Orphan content</div><div className="mt-2 text-2xl font-semibold text-amber-300">{report?.summary.orphanContent || 0}</div></div>
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4"><div className="text-xs text-slate-400">Missing support pages</div><div className="mt-2 text-2xl font-semibold text-rose-300">{report?.summary.missingSupportPages || 0}</div></div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-white">Editorial Queue</h2>
              <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                {report?.queue.map((item) => (
                  <span key={item.status} className="rounded-full bg-slate-800 px-3 py-1">
                    {item.status}: {item.count}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {topics.opportunities.map((opportunity) => (
                <div key={opportunity.id} className="rounded-xl border border-slate-700 bg-[#0f172a] p-4">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-violet-500/20 px-2 py-1 text-violet-200">{opportunity.opportunityType || 'EDITORIAL'}</span>
                        <span className="rounded-full bg-slate-800 px-2 py-1 text-slate-300">{opportunity.priority}</span>
                        <span className="rounded-full bg-slate-800 px-2 py-1 text-slate-300">{opportunity.status}</span>
                      </div>
                      <div className="text-base font-semibold text-white">{opportunity.name}</div>
                      <div className="text-sm text-slate-400">{opportunity.summary || 'Oportunitate editoriala fara sumar.'}</div>
                      <div className="text-xs text-slate-500">
                        {opportunity.cluster?.name ? `Cluster: ${opportunity.cluster.name}` : 'Fara cluster'} {opportunity.category?.name ? `· Categorie: ${opportunity.category.name}` : ''}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 xl:min-w-[220px]">
                      <select
                        value={opportunity.status}
                        onChange={(event) => updateOpportunityStatus(opportunity.id, event.target.value)}
                        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                      >
                        {WORKFLOW_OPTIONS.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                      <button type="button" onClick={() => generateBrief(opportunity.id)} className="rounded-lg bg-[#8b5cf6] px-3 py-2 text-sm text-white">
                        Genereaza brief
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Hub Clusters</h2>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {topics.clusters.map((cluster) => (
                <div key={cluster.id} className="rounded-xl border border-slate-700 bg-[#0f172a] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-semibold text-white">{cluster.name}</div>
                      <div className="text-xs text-slate-400">/{cluster.slug} · {cluster.priority} · {cluster.status}</div>
                    </div>
                    <button type="button" onClick={() => createHub(cluster.id)} className="rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-100">
                      {cluster.pillarPost ? 'Open hub draft' : 'Create hub draft'}
                    </button>
                  </div>

                  <p className="mt-3 text-sm text-slate-400">{cluster.description || 'Fara descriere.'}</p>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-300">
                    <div className="rounded-lg bg-slate-900 px-3 py-2">Posts: {cluster._count.posts}</div>
                    <div className="rounded-lg bg-slate-900 px-3 py-2">Keywords: {cluster._count.keywords}</div>
                    <div className="rounded-lg bg-slate-900 px-3 py-2">Briefs: {cluster._count.briefs}</div>
                    <div className="rounded-lg bg-slate-900 px-3 py-2">Opps: {cluster._count.opportunities}</div>
                  </div>

                  {cluster.pillarPost && (
                    <div className="mt-3 text-xs text-emerald-300">
                      Hub legat: {cluster.pillarPost.category?.slug ? `/${cluster.pillarPost.category.slug}/${cluster.pillarPost.slug}` : cluster.pillarPost.slug}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Coverage & Gaps</h2>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-200">Cluster coverage</h3>
                {report?.clusterCoverage.map((cluster) => (
                  <div key={cluster.id} className="rounded-lg border border-slate-700 bg-[#0f172a] p-3 text-sm text-slate-200">
                    <div className="flex items-center justify-between gap-3">
                      <span>{cluster.name}</span>
                      <span className="text-violet-300">{cluster.coverageScore}/100</span>
                    </div>
                    <div className="mt-2 text-xs text-slate-400">
                      support pages {cluster.publishedSupportCount} · keywords {cluster.keywordCount} · opps {cluster.opportunityCount}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-200">Missing support pages</h3>
                {report?.missingSupportPages.map((item, index) => (
                  <div key={`${item.type}-${index}`} className="rounded-lg border border-slate-700 bg-[#0f172a] p-3 text-sm text-slate-200">
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Top opportunities</h2>
            <div className="space-y-3">
              {report?.topOpportunities.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-700 bg-[#0f172a] p-3 text-sm text-slate-200">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-white">{item.name}</span>
                    <span className="text-violet-300">{item.score}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">{item.type || 'EDITORIAL'} · {item.status}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Orphan content</h2>
            <div className="space-y-3 text-sm text-slate-200">
              {report?.orphanContent.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-700 bg-[#0f172a] p-3">
                  <div className="font-medium text-white">{item.title}</div>
                  <div className="text-xs text-slate-400">{item.url}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Latest brief</h2>
            {activeBrief ? (
              <div className="space-y-4">
                <div>
                  <div className="text-base font-semibold text-white">{activeBrief.title || activeBrief.name}</div>
                  <div className="text-xs text-slate-400">{activeBrief.opportunity?.name || 'Brief editorial'} · {new Date(activeBrief.updatedAt).toLocaleString('ro-RO')}</div>
                </div>

                <div className="rounded-lg bg-[#0f172a] p-3 text-sm text-slate-200">
                  <div className="text-xs uppercase tracking-wide text-slate-400">Meta</div>
                  <div className="mt-2 font-medium text-white">{activeBrief.metaTitle}</div>
                  <div className="mt-1 text-slate-400">{activeBrief.metaDescription}</div>
                </div>

                <div className="rounded-lg bg-[#0f172a] p-3 text-sm text-slate-200">
                  <div className="text-xs uppercase tracking-wide text-slate-400">Outline</div>
                  <div className="mt-3 space-y-2">
                    {(activeBrief.outline || []).map((item, index) => (
                      <div key={`${item.heading}-${index}`} className="rounded border border-slate-700 p-2">
                        <div className="font-medium text-white">{item.heading}</div>
                        <div className="text-xs text-slate-400">{item.goal}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg bg-[#0f172a] p-3 text-sm text-slate-200">
                  <div className="text-xs uppercase tracking-wide text-slate-400">FAQ + GEO blocks</div>
                  <div className="mt-3 space-y-2">
                    {(activeBrief.faq || []).slice(0, 4).map((item, index) => (
                      <div key={`${item.question}-${index}`} className="rounded border border-slate-700 p-2">
                        <div className="font-medium text-white">{item.question}</div>
                        <div className="text-xs text-slate-400">{item.answer}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(activeBrief.geoBlocks || []).map((item) => (
                      <span key={item} className="rounded-full bg-violet-500/20 px-2 py-1 text-xs text-violet-200">{item}</span>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg bg-[#0f172a] p-3 text-sm text-slate-200">
                  <div className="text-xs uppercase tracking-wide text-slate-400">Internal links & monetization</div>
                  <div className="mt-3 space-y-2">
                    {(activeBrief.internalLinks || []).map((item, index) => (
                      <div key={`${item.url}-${index}`} className="rounded border border-slate-700 p-2 text-xs">
                        <div className="font-medium text-white">{item.label}</div>
                        <div className="text-slate-400">{item.url} · {item.type}</div>
                      </div>
                    ))}
                  </div>
                  {activeBrief.monetizationNotes && <pre className="mt-3 whitespace-pre-wrap text-xs text-slate-400">{activeBrief.monetizationNotes}</pre>}
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-400">Genereaza un brief din Editorial Queue si il vei vedea aici.</div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
