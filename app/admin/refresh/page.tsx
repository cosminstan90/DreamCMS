'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type RefreshStatus = 'FRESH' | 'WATCH' | 'REFRESH_NEEDED' | 'IN_REFRESH' | 'REFRESHED'

type RefreshRow = {
  id: string
  title: string
  slug: string
  postType: string
  status: string
  url: string
  refreshStatus: RefreshStatus
  refreshNotes: string | null
  lastReviewedAt: string | null
  updatedAt: string
  publishedAt: string | null
  ageDays: number
  wordCount: number
  linkCount: number
  missingImageAltCount: number
  contentDecayScore: number
  contentHealthScore: number
  refreshPriority: number
  reasons: string[]
  recommendedActions: string[]
}

type RefreshReport = {
  summary: {
    totalPublished: number
    refreshNeeded: number
    watch: number
    inRefresh: number
    refreshed: number
    avgDecayScore: number
    avgHealthScore: number
    withoutReview: number
  }
  urgent: RefreshRow[]
  watchlist: RefreshRow[]
  recentlyRefreshed: RefreshRow[]
  all: RefreshRow[]
}

const FILTERS: Array<{ key: 'ALL' | RefreshStatus; label: string }> = [
  { key: 'ALL', label: 'Toate' },
  { key: 'REFRESH_NEEDED', label: 'Refresh needed' },
  { key: 'WATCH', label: 'Watch' },
  { key: 'IN_REFRESH', label: 'In refresh' },
  { key: 'REFRESHED', label: 'Refreshed' },
]

function statusBadge(status: RefreshStatus) {
  if (status === 'REFRESH_NEEDED') return 'bg-rose-500/15 text-rose-200 border-rose-500/30'
  if (status === 'WATCH') return 'bg-amber-500/15 text-amber-200 border-amber-500/30'
  if (status === 'IN_REFRESH') return 'bg-sky-500/15 text-sky-200 border-sky-500/30'
  if (status === 'REFRESHED') return 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30'
  return 'bg-slate-700/60 text-slate-200 border-slate-600'
}

export const dynamic = 'force-dynamic'

export default function RefreshAdminPage() {
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [report, setReport] = useState<RefreshReport | null>(null)
  const [filter, setFilter] = useState<'ALL' | RefreshStatus>('ALL')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  async function loadData() {
    setLoading(true)
    try {
      const res = await fetch('/api/content-refresh/report')
      const json = await res.json()
      setReport(json)

      const nextNotes: Record<string, string> = {}
      for (const row of Array.isArray(json.all) ? json.all : []) {
        nextNotes[row.id] = row.refreshNotes || ''
      }
      setNotes(nextNotes)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const rows = useMemo(() => {
    const list = report?.all || []
    if (filter === 'ALL') return list
    return list.filter((row) => row.refreshStatus === filter)
  }, [filter, report])

  async function runSync() {
    setSyncing(true)
    setStatusMessage(null)
    try {
      const res = await fetch('/api/content-refresh/sync', { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        setStatusMessage(`Refresh sync complet. ${json.summary.total} pagini analizate.`)
        await loadData()
      } else {
        setStatusMessage(json.error || 'Sync failed.')
      }
    } finally {
      setSyncing(false)
    }
  }

  async function updateRow(id: string, refreshStatus: RefreshStatus, markReviewed = false) {
    setSavingId(id)
    setStatusMessage(null)
    try {
      const res = await fetch(`/api/content-refresh/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refreshStatus,
          refreshNotes: notes[id] || '',
          markReviewed,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setStatusMessage(json.error || 'Nu am putut salva actualizarea.')
      } else {
        setStatusMessage('Statusul de refresh a fost actualizat.')
        await loadData()
      }
    } finally {
      setSavingId(null)
    }
  }

  if (loading) {
    return <div className="text-slate-300">Se incarca refresh engine...</div>
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-slate-700 bg-[#1e293b] p-6 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Stale Content & Refresh Ops</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">
            Monitorizam paginile care isi pierd forta SEO si GEO, le prioritizam si le trecem printr-un workflow editorial clar.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/admin/topics" className="rounded-lg bg-slate-800 px-4 py-2 text-sm text-slate-100">
            Open Topic Authority
          </Link>
          <button type="button" onClick={runSync} className="rounded-lg bg-[#8b5cf6] px-4 py-2 text-sm font-medium text-white">
            {syncing ? 'Analizam...' : 'Run refresh sync'}
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-sm text-violet-100">
          {statusMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 xl:grid-cols-7">
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4"><div className="text-xs text-slate-400">Published</div><div className="mt-2 text-2xl font-semibold text-white">{report?.summary.totalPublished || 0}</div></div>
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4"><div className="text-xs text-slate-400">Refresh needed</div><div className="mt-2 text-2xl font-semibold text-rose-300">{report?.summary.refreshNeeded || 0}</div></div>
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4"><div className="text-xs text-slate-400">Watch</div><div className="mt-2 text-2xl font-semibold text-amber-300">{report?.summary.watch || 0}</div></div>
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4"><div className="text-xs text-slate-400">In refresh</div><div className="mt-2 text-2xl font-semibold text-sky-300">{report?.summary.inRefresh || 0}</div></div>
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4"><div className="text-xs text-slate-400">Refreshed</div><div className="mt-2 text-2xl font-semibold text-emerald-300">{report?.summary.refreshed || 0}</div></div>
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4"><div className="text-xs text-slate-400">Avg decay</div><div className="mt-2 text-2xl font-semibold text-white">{report?.summary.avgDecayScore || 0}</div></div>
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4"><div className="text-xs text-slate-400">No review yet</div><div className="mt-2 text-2xl font-semibold text-white">{report?.summary.withoutReview || 0}</div></div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`rounded-full border px-4 py-2 text-sm ${filter === item.key ? 'border-violet-400 bg-violet-500/15 text-violet-100' : 'border-slate-700 bg-[#0f172a] text-slate-300'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Urgent queue</h2>
            <div className="space-y-3 text-sm text-slate-200">
              {(report?.urgent || []).map((row) => (
                <div key={row.id} className="rounded-lg border border-slate-700 bg-[#0f172a] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-white">{row.title}</div>
                    <span className={`rounded-full border px-2 py-1 text-xs ${statusBadge(row.refreshStatus)}`}>
                      {row.refreshStatus}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">Priority {row.refreshPriority} - decay {row.contentDecayScore} - health {row.contentHealthScore}</div>
                  <div className="mt-1 text-xs text-slate-500">{row.url}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">Recently refreshed</h2>
            <div className="space-y-3 text-sm text-slate-200">
              {(report?.recentlyRefreshed || []).length === 0 && <div className="text-slate-400">Inca nu avem pagini marcate ca refreshed.</div>}
              {(report?.recentlyRefreshed || []).map((row) => (
                <div key={row.id} className="rounded-lg border border-slate-700 bg-[#0f172a] p-3">
                  <div className="font-medium text-white">{row.title}</div>
                  <div className="mt-1 text-xs text-slate-400">Ultimul review: {row.lastReviewedAt ? new Date(row.lastReviewedAt).toLocaleDateString('ro-RO') : 'N/A'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.id} className="rounded-xl border border-slate-700 bg-[#1e293b] p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded-full border px-2 py-1 ${statusBadge(row.refreshStatus)}`}>{row.refreshStatus}</span>
                    <span className="rounded-full border border-slate-700 bg-[#0f172a] px-2 py-1 text-slate-300">Priority {row.refreshPriority}</span>
                    <span className="rounded-full border border-slate-700 bg-[#0f172a] px-2 py-1 text-slate-300">Decay {row.contentDecayScore}</span>
                    <span className="rounded-full border border-slate-700 bg-[#0f172a] px-2 py-1 text-slate-300">Health {row.contentHealthScore}</span>
                  </div>

                  <div>
                    <div className="text-lg font-semibold text-white">{row.title}</div>
                    <div className="mt-1 text-xs text-slate-400">{row.url}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 md:grid-cols-5">
                    <div className="rounded-lg bg-[#0f172a] px-3 py-2">Age {row.ageDays} zile</div>
                    <div className="rounded-lg bg-[#0f172a] px-3 py-2">Words {row.wordCount}</div>
                    <div className="rounded-lg bg-[#0f172a] px-3 py-2">Links {row.linkCount}</div>
                    <div className="rounded-lg bg-[#0f172a] px-3 py-2">Missing alt {row.missingImageAltCount}</div>
                    <div className="rounded-lg bg-[#0f172a] px-3 py-2">Reviewed {row.lastReviewedAt ? new Date(row.lastReviewedAt).toLocaleDateString('ro-RO') : 'never'}</div>
                  </div>

                  <div>
                    <div className="mb-2 text-xs uppercase tracking-wide text-slate-500">Why this page is here</div>
                    <div className="flex flex-wrap gap-2">
                      {row.reasons.map((reason, index) => (
                        <span key={`${row.id}-reason-${index}`} className="rounded-full border border-slate-700 bg-[#0f172a] px-3 py-1 text-xs text-slate-300">
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-xs uppercase tracking-wide text-slate-500">Recommended actions</div>
                    <div className="space-y-2 text-sm text-slate-200">
                      {row.recommendedActions.map((item, index) => (
                        <div key={`${row.id}-action-${index}`} className="rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-3 xl:max-w-[280px]">
                  <Link href={`/admin/posts/${row.id}`} className="rounded-lg bg-slate-800 px-4 py-2 text-center text-sm text-slate-100">
                    Open editor
                  </Link>

                  <textarea
                    value={notes[row.id] || ''}
                    onChange={(event) => setNotes((current) => ({ ...current, [row.id]: event.target.value }))}
                    rows={4}
                    placeholder="Refresh notes for editor"
                    className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2 text-sm text-slate-100"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => updateRow(row.id, 'WATCH')} className="rounded-lg bg-amber-500/20 px-3 py-2 text-sm text-amber-100">
                      Set WATCH
                    </button>
                    <button type="button" onClick={() => updateRow(row.id, 'IN_REFRESH')} className="rounded-lg bg-sky-500/20 px-3 py-2 text-sm text-sky-100">
                      Set IN REFRESH
                    </button>
                    <button type="button" onClick={() => updateRow(row.id, 'REFRESHED', true)} className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-100">
                      Mark REFRESHED
                    </button>
                    <button type="button" onClick={() => updateRow(row.id, 'FRESH', true)} className="rounded-lg bg-slate-700 px-3 py-2 text-sm text-slate-100">
                      Mark REVIEWED
                    </button>
                  </div>

                  {savingId === row.id && <div className="text-xs text-slate-400">Saving...</div>}
                </div>
              </div>
            </div>
          ))}

          {rows.length === 0 && (
            <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-6 text-sm text-slate-400">
              Nu exista pagini in filtrul curent. Ruleaza refresh sync daca tocmai ai facut update-uri mari.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}