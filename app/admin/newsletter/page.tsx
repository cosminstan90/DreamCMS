'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

type Subscriber = {
  id: string
  email: string
  name: string | null
  status: 'ACTIVE' | 'UNSUBSCRIBED'
  sourcePath: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  signupCount: number
  createdAt: string
  lastSignupAt: string
}

type TopItem = { key: string; count: number }

type Stats = {
  bySource: TopItem[]
  byCampaign: TopItem[]
  byReferrer: TopItem[]
}

export default function AdminNewsletterPage() {
  const [data, setData] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [stats, setStats] = useState<Stats>({ bySource: [], byCampaign: [], byReferrer: [] })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '40')
      if (search.trim()) params.set('search', search.trim())
      if (status) params.set('status', status)

      const res = await fetch(`/api/newsletter?${params.toString()}`)
      const json = await res.json()
      setData(Array.isArray(json.data) ? json.data : [])
      setPages(Number(json.pages || 1))
      setTotal(Number(json.total || 0))
      setStats(json.stats || { bySource: [], byCampaign: [], byReferrer: [] })
    } finally {
      setLoading(false)
    }
  }, [page, search, status])

  useEffect(() => {
    void load()
  }, [load])

  const activeCount = useMemo(() => data.filter((item) => item.status === 'ACTIVE').length, [data])

  async function updateStatus(id: string, nextStatus: 'ACTIVE' | 'UNSUBSCRIBED') {
    const res = await fetch(`/api/newsletter/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    })
    if (res.ok) await load()
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-white">Newsletter Subscribers</h1>
        <a href="/api/newsletter?format=csv" className="rounded-lg bg-slate-700 px-4 py-2 text-slate-100">Export CSV</a>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4"><div className="text-xs text-slate-400">Total listati</div><div className="text-2xl font-semibold text-white">{total}</div></div>
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4"><div className="text-xs text-slate-400">Activi (pagina curenta)</div><div className="text-2xl font-semibold text-white">{activeCount}</div></div>
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4"><div className="text-xs text-slate-400">Status</div><div className="text-sm text-slate-200">{loading ? 'Se incarca...' : 'Sincronizat'}</div></div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4">
          <div className="mb-2 text-sm font-semibold text-white">Top Sources</div>
          <div className="space-y-1 text-sm text-slate-300">
            {stats.bySource.slice(0, 8).map((item) => <div key={item.key} className="flex justify-between"><span>{item.key}</span><span>{item.count}</span></div>)}
            {stats.bySource.length === 0 && <div className="text-slate-400">Fara date</div>}
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4">
          <div className="mb-2 text-sm font-semibold text-white">Top Campaigns</div>
          <div className="space-y-1 text-sm text-slate-300">
            {stats.byCampaign.slice(0, 8).map((item) => <div key={item.key} className="flex justify-between"><span>{item.key}</span><span>{item.count}</span></div>)}
            {stats.byCampaign.length === 0 && <div className="text-slate-400">Fara date</div>}
          </div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4">
          <div className="mb-2 text-sm font-semibold text-white">Top Referrers</div>
          <div className="space-y-1 text-sm text-slate-300">
            {stats.byReferrer.slice(0, 8).map((item) => <div key={item.key} className="flex justify-between"><span className="truncate max-w-[80%]">{item.key}</span><span>{item.count}</span></div>)}
            {stats.byReferrer.length === 0 && <div className="text-slate-400">Fara date</div>}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-700 bg-[#1e293b] p-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cauta email/nume/source/campaign"
          className="rounded border border-slate-700 bg-[#0f172a] px-3 py-2 text-slate-100"
        />
        <select
          value={status}
          onChange={(e) => {
            setPage(1)
            setStatus(e.target.value)
          }}
          className="rounded border border-slate-700 bg-[#0f172a] px-3 py-2 text-slate-100"
        >
          <option value="">Toate statusurile</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="UNSUBSCRIBED">UNSUBSCRIBED</option>
        </select>
        <button
          onClick={() => {
            setPage(1)
            void load()
          }}
          className="rounded bg-[#8b5cf6] px-4 py-2 text-white"
        >
          Filtreaza
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-700 bg-[#1e293b] p-4">
        <table className="w-full text-sm text-slate-200">
          <thead>
            <tr className="text-left text-slate-400">
              <th className="py-2">Email</th>
              <th className="py-2">Nume</th>
              <th className="py-2">Status</th>
              <th className="py-2">Source / Medium</th>
              <th className="py-2">Campaign</th>
              <th className="py-2">Signupuri</th>
              <th className="py-2">Ultima abonare</th>
              <th className="py-2">Actiuni</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="border-t border-slate-700">
                <td className="py-2">{row.email}</td>
                <td className="py-2">{row.name || '-'}</td>
                <td className="py-2">
                  <span className={`rounded px-2 py-1 text-xs ${row.status === 'ACTIVE' ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-200'}`}>
                    {row.status}
                  </span>
                </td>
                <td className="py-2">{row.utmSource || 'direct'} / {row.utmMedium || '-'}</td>
                <td className="py-2">{row.utmCampaign || '-'}</td>
                <td className="py-2">{row.signupCount}</td>
                <td className="py-2">{new Date(row.lastSignupAt).toLocaleString('ro-RO')}</td>
                <td className="py-2">
                  {row.status === 'ACTIVE' ? (
                    <button className="rounded bg-rose-700 px-2 py-1 text-xs text-white" onClick={() => updateStatus(row.id, 'UNSUBSCRIBED')}>Dezactiveaza</button>
                  ) : (
                    <button className="rounded bg-emerald-700 px-2 py-1 text-xs text-white" onClick={() => updateStatus(row.id, 'ACTIVE')}>Reactiveaza</button>
                  )}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={8} className="py-6 text-center text-slate-400">Nu exista abonati pentru filtrul curent.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="rounded bg-slate-700 px-3 py-2 text-slate-100 disabled:opacity-50"
        >
          Inapoi
        </button>
        <div className="text-sm text-slate-300">Pagina {page} / {pages}</div>
        <button
          disabled={page >= pages}
          onClick={() => setPage((p) => p + 1)}
          className="rounded bg-slate-700 px-3 py-2 text-slate-100 disabled:opacity-50"
        >
          Inainte
        </button>
      </div>
    </section>
  )
}
