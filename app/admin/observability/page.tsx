'use client'

import { useEffect, useState } from 'react'

type MetricSummary = {
  metric: 'LCP' | 'INP' | 'CLS' | 'TTFB' | 'FCP'
  samples: number
  average: number
  p75: number
  good: number
  needsImprovement: number
  poor: number
}

type PoorPage = {
  route: string
  pageViews: number
  score: number
  poorEvents: number
  needsImprovementEvents: number
  samples: number
  metrics: Array<{ metric: string; poor: number; needsImprovement: number; average: number }>
}

type TopError = {
  route: string
  message: string
  count: number
  lastSeen: string
}

type ObservabilityReport = {
  summary: {
    days: number
    totalVitalSamples: number
    totalClientErrors: number
    totalPoor: number
    totalNeedsImprovement: number
    avgScore: number
  }
  metrics: MetricSummary[]
  poorPages: PoorPage[]
  topErrors: TopError[]
  health: {
    uptimeSeconds: number
    timestamp: string
    backup: { status: string; createdAt: string; ageHours: number | null } | null
  }
}

function metricUnit(metric: string) {
  return metric === 'CLS' ? '' : 'ms'
}

function metricLabel(metric: string) {
  if (metric === 'TTFB') return 'TTFB'
  return metric
}

export const dynamic = 'force-dynamic'

export default function ObservabilityPage() {
  const [days, setDays] = useState<7 | 30>(7)
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<ObservabilityReport | null>(null)

  async function loadData(windowDays: 7 | 30) {
    setLoading(true)
    try {
      const res = await fetch(`/api/observability/report?days=${windowDays}`)
      const json = await res.json()
      setReport(json)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(days)
  }, [days])

  if (loading && !report) {
    return <div className="text-slate-300">Se incarca observability...</div>
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-slate-700 bg-[#1e293b] p-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Observability & Web Vitals</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Monitorizam performanta reala din browser, erorile client si paginile care pun presiune pe experienta utilizatorului.
          </p>
        </div>
        <div className="flex gap-2">
          {[7, 30].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setDays(value as 7 | 30)}
              className={`rounded-lg px-4 py-2 text-sm ${days === value ? 'bg-[#8b5cf6] text-white' : 'bg-slate-800 text-slate-200'}`}
            >
              Ultimele {value} zile
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4"><div className="text-xs text-slate-400">Vital samples</div><div className="mt-2 text-2xl font-semibold text-white">{report?.summary.totalVitalSamples || 0}</div></div>
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4"><div className="text-xs text-slate-400">Client errors</div><div className="mt-2 text-2xl font-semibold text-rose-300">{report?.summary.totalClientErrors || 0}</div></div>
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4"><div className="text-xs text-slate-400">Poor vitals</div><div className="mt-2 text-2xl font-semibold text-rose-300">{report?.summary.totalPoor || 0}</div></div>
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4"><div className="text-xs text-slate-400">Needs improvement</div><div className="mt-2 text-2xl font-semibold text-amber-300">{report?.summary.totalNeedsImprovement || 0}</div></div>
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4"><div className="text-xs text-slate-400">Avg route score</div><div className="mt-2 text-2xl font-semibold text-white">{report?.summary.avgScore || 100}</div></div>
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4"><div className="text-xs text-slate-400">Process uptime</div><div className="mt-2 text-2xl font-semibold text-white">{report?.health.uptimeSeconds ? Math.round(report.health.uptimeSeconds / 3600) : 0}h</div></div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Core metrics</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(report?.metrics || []).map((metric) => (
              <div key={metric.metric} className="rounded-xl border border-slate-700 bg-[#0f172a] p-4 text-sm text-slate-200">
                <div className="text-xs text-slate-400">{metricLabel(metric.metric)}</div>
                <div className="mt-2 text-2xl font-semibold text-white">{metric.p75}{metricUnit(metric.metric)}</div>
                <div className="text-xs text-slate-400">p75 · avg {metric.average}{metricUnit(metric.metric)} · {metric.samples} samples</div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-emerald-200">Good {metric.good}</span>
                  <span className="rounded-full bg-amber-500/15 px-2 py-1 text-amber-200">NI {metric.needsImprovement}</span>
                  <span className="rounded-full bg-rose-500/15 px-2 py-1 text-rose-200">Poor {metric.poor}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Health</h2>
          <div className="space-y-3 text-sm text-slate-200">
            <div className="rounded-lg bg-[#0f172a] p-4">Timestamp: {report?.health.timestamp ? new Date(report.health.timestamp).toLocaleString('ro-RO') : 'N/A'}</div>
            <div className="rounded-lg bg-[#0f172a] p-4">Backup: {report?.health.backup ? `${report.health.backup.status} · ${report.health.backup.ageHours}h ago` : 'N/A'}</div>
            <div className="rounded-lg bg-[#0f172a] p-4">Interpretare: daca vezi crestere pe `INP`, `LCP` sau multe erori client, verificam layout-ul, scripturile third-party si paginile cu media grea.</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Worst pages</h2>
          <div className="space-y-3">
            {(report?.poorPages || []).length === 0 && <div className="text-sm text-slate-400">Nu avem suficiente date de Web Vitals inca.</div>}
            {(report?.poorPages || []).map((page) => (
              <div key={page.route} className="rounded-lg border border-slate-700 bg-[#0f172a] p-4 text-sm text-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-white">{page.route}</div>
                  <span className="rounded-full bg-rose-500/15 px-2 py-1 text-xs text-rose-200">score {page.score}</span>
                </div>
                <div className="mt-1 text-xs text-slate-400">PV {page.pageViews} · samples {page.samples} · poor {page.poorEvents} · needs improvement {page.needsImprovementEvents}</div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {page.metrics.map((metric) => (
                    <span key={`${page.route}-${metric.metric}`} className="rounded-full border border-slate-700 px-2 py-1 text-slate-300">
                      {metric.metric}: avg {metric.average}{metric.metric === 'CLS' ? '' : 'ms'} · poor {metric.poor}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-6">
          <h2 className="mb-4 text-lg font-semibold text-white">Top client errors</h2>
          <div className="space-y-3">
            {(report?.topErrors || []).length === 0 && <div className="text-sm text-slate-400">Nu exista erori client in intervalul selectat.</div>}
            {(report?.topErrors || []).map((row, index) => (
              <div key={`${row.route}-${index}`} className="rounded-lg border border-slate-700 bg-[#0f172a] p-4 text-sm text-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium text-white">{row.message}</div>
                  <span className="rounded-full bg-rose-500/15 px-2 py-1 text-xs text-rose-200">{row.count}</span>
                </div>
                <div className="mt-1 text-xs text-slate-400">{row.route}</div>
                <div className="mt-1 text-xs text-slate-500">Last seen: {new Date(row.lastSeen).toLocaleString('ro-RO')}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}