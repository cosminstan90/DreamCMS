'use client'

import { useEffect, useMemo, useState } from 'react'

type QueryInsight = {
  id: string
  query: string
  pagePath: string
  impressions: number
  clicks: number
  ctr: number
  position: number
  intent: string
  clusterLabel: string | null
  recommendedTemplate: string | null
  recommendedCta: string | null
  monetizationFit: string | null
  opportunityScore: number
}

type ClusterCoverage = {
  id: string
  name: string
  slug: string
  demand: number
  avgCtr: number
  supportPages: number
  keywordCount: number
  queryCount: number
  completenessScore: number
  gapScore: number
}

type CroSuggestion = {
  id: string
  query: string
  pagePath: string
  impressions: number
  ctr: number
  template: string | null
  cta: string | null
  fit: string | null
  score: number
  suggestion: string
}

type GrowthReport = {
  summary: {
    importedQueries: number
    highOpportunityQueries: number
    lowCtrQueries: number
    gapQueries: number
    activeOpportunities: number
  }
  topQueries: QueryInsight[]
  ctrOpportunities: QueryInsight[]
  supportPageSuggestions: QueryInsight[]
  clusterCoverage: ClusterCoverage[]
  croSuggestions: CroSuggestion[]
  syncedOpportunities: Array<{ id: string; name: string; type: string | null; priority: string; status: string }>
}

const SAMPLE_HEADERS = 'query,page,clicks,impressions,ctr,position'

export const dynamic = 'force-dynamic'

export default function GrowthPage() {
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [source, setSource] = useState('gsc-csv')
  const [csvText, setCsvText] = useState('')
  const [report, setReport] = useState<GrowthReport | null>(null)

  async function loadReport() {
    setLoading(true)
    try {
      const res = await fetch('/api/growth/report')
      const json = await res.json()
      setReport(json)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReport()
  }, [])

  const sampleCsv = useMemo(
    () => `${SAMPLE_HEADERS}\nce inseamna cand visezi serpi,/dictionar/S/serpi,120,4200,2.86,7.4\napa in vis,,35,1800,1.94,12.1`,
    [],
  )

  async function importCsv() {
    setImporting(true)
    setStatusMessage(null)
    try {
      const res = await fetch('/api/growth/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText, source }),
      })
      const json = await res.json()
      if (!res.ok) {
        setStatusMessage(json.error || 'Import failed.')
      } else {
        setStatusMessage(`Import complet. ${json.imported} query-uri procesate.`)
        await loadReport()
      }
    } finally {
      setImporting(false)
    }
  }

  if (loading && !report) {
    return <div className="text-slate-300">Se incarca growth intelligence...</div>
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-slate-700 bg-[#1e293b] p-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Growth Intelligence</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Importam query-uri reale, le legam de clustere, identificam gap-uri SEO si recomandam CTA-uri CRO pe aceleasi pagini.
          </p>
        </div>
        <button type="button" onClick={loadReport} className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-100">
          Refresh report
        </button>
      </div>

      {statusMessage && <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-sm text-violet-100">{statusMessage}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4"><div className="text-xs text-slate-400">Imported queries</div><div className="mt-2 text-2xl font-semibold text-white">{report?.summary.importedQueries || 0}</div></div>
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4"><div className="text-xs text-slate-400">High opportunity</div><div className="mt-2 text-2xl font-semibold text-violet-200">{report?.summary.highOpportunityQueries || 0}</div></div>
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4"><div className="text-xs text-slate-400">Low CTR</div><div className="mt-2 text-2xl font-semibold text-amber-300">{report?.summary.lowCtrQueries || 0}</div></div>
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4"><div className="text-xs text-slate-400">Search gaps</div><div className="mt-2 text-2xl font-semibold text-rose-300">{report?.summary.gapQueries || 0}</div></div>
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4"><div className="text-xs text-slate-400">Synced opps</div><div className="mt-2 text-2xl font-semibold text-emerald-300">{report?.summary.activeOpportunities || 0}</div></div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Import CSV</h2>
            <div className="space-y-3">
              <input value={source} onChange={(event) => setSource(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2 text-slate-100" placeholder="source" />
              <textarea value={csvText} onChange={(event) => setCsvText(event.target.value)} rows={10} className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2 font-mono text-xs text-slate-100" placeholder={sampleCsv} />
              <button type="button" onClick={importCsv} className="rounded-lg bg-[#8b5cf6] px-4 py-2 text-sm text-white">
                {importing ? 'Importam...' : 'Import queries'}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Top queries</h2>
            <div className="space-y-3 text-sm text-slate-200">
              {(report?.topQueries || []).map((row) => (
                <div key={row.id} className="rounded-lg border border-slate-700 bg-[#0f172a] p-3">
                  <div className="font-medium text-white">{row.query}</div>
                  <div className="mt-1 text-xs text-slate-400">{row.pagePath || 'No mapped page'} · {row.impressions} imp · CTR {row.ctr}% · Pos {row.position}</div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-slate-800 px-2 py-1 text-slate-300">{row.intent}</span>
                    {row.clusterLabel && <span className="rounded-full bg-violet-500/15 px-2 py-1 text-violet-200">{row.clusterLabel}</span>}
                    {row.recommendedTemplate && <span className="rounded-full bg-slate-800 px-2 py-1 text-slate-300">{row.recommendedTemplate}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">CTR + CRO opportunities</h2>
            <div className="space-y-3">
              {(report?.croSuggestions || []).map((row) => (
                <div key={row.id} className="rounded-lg border border-slate-700 bg-[#0f172a] p-4 text-sm text-slate-200">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-white">{row.query}</div>
                    <span className="rounded-full bg-[#8b5cf6]/20 px-2 py-1 text-xs text-violet-200">score {row.score}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">{row.pagePath || 'No mapped page'} · {row.impressions} imp · CTR {row.ctr}%</div>
                  <div className="mt-2 text-xs text-slate-300">CTA: {row.cta || 'n/a'} · Fit: {row.fit || 'n/a'} · Template: {row.template || 'n/a'}</div>
                  <div className="mt-3 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300">{row.suggestion}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Cluster completeness</h2>
            <div className="space-y-3">
              {(report?.clusterCoverage || []).map((cluster) => (
                <div key={cluster.id} className="rounded-lg border border-slate-700 bg-[#0f172a] p-4 text-sm text-slate-200">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-white">{cluster.name}</div>
                    <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">{cluster.completenessScore}/100</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">Demand {cluster.demand} · Queries {cluster.queryCount} · Support pages {cluster.supportPages} · Avg CTR {cluster.avgCtr}%</div>
                  <div className="mt-2 text-xs text-amber-300">Gap score {cluster.gapScore}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Support page suggestions</h2>
            <div className="space-y-3 text-sm text-slate-200">
              {(report?.supportPageSuggestions || []).map((row) => (
                <div key={row.id} className="rounded-lg border border-slate-700 bg-[#0f172a] p-4">
                  <div className="font-medium text-white">{row.query}</div>
                  <div className="mt-1 text-xs text-slate-400">{row.impressions} imp · Pos {row.position} · {row.clusterLabel || 'No cluster'} · {row.recommendedTemplate || 'Template n/a'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}