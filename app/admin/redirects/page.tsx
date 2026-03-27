'use client'

import { useEffect, useMemo, useState } from 'react'

type RedirectItem = {
  id: string
  fromPath: string
  toPath: string
  statusCode: number
  hits: number
  isActive: boolean
  createdAt: string
}

const PAGE_SIZE = 50

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter(Boolean)
  const rows = [] as Array<{ fromPath: string; toPath: string; statusCode: number }>
  for (const line of lines) {
    const [fromPath, toPath, statusCode] = line.split(',').map((item) => item.trim())
    if (!fromPath || !toPath) continue
    rows.push({ fromPath, toPath, statusCode: Number(statusCode || 301) })
  }
  return rows
}

export default function RedirectsPage() {
  const [items, setItems] = useState<RedirectItem[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [csvOpen, setCsvOpen] = useState(false)
  const [csvText, setCsvText] = useState('')

  async function loadData(nextPage = page) {
    setLoading(true)
    const params = new URLSearchParams({ page: String(nextPage), limit: String(PAGE_SIZE) })
    if (search) params.set('search', search)
    const res = await fetch(`/api/redirects?${params.toString()}`)
    const json = await res.json()
    setItems(json.data || [])
    setTotal(json.total || 0)
    setPage(nextPage)
    setLoading(false)
  }

  useEffect(() => {
    loadData(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const stats = useMemo(() => {
    const active = items.filter((item) => item.isActive).length
    const hits = items.reduce((acc, item) => acc + item.hits, 0)
    return { active, total: total || items.length, hits }
  }, [items, total])

  async function toggle(id: string) {
    await fetch(`/api/redirects/${id}/toggle`, { method: 'PUT' })
    await loadData(page)
  }

  async function remove(id: string) {
    if (!window.confirm('Stergi redirectul?')) return
    await fetch(`/api/redirects/${id}`, { method: 'DELETE' })
    await loadData(page)
  }

  async function importCsv() {
    const rows = parseCsv(csvText)
    for (const row of rows) {
      await fetch('/api/redirects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(row),
      })
    }
    setCsvOpen(false)
    setCsvText('')
    await loadData(1)
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cauta redirect"
            className="px-3 py-2 rounded-lg bg-[#0f172a] border border-slate-700 text-slate-200"
          />
          <button className="px-3 py-2 rounded bg-slate-700 text-slate-100" onClick={() => setCsvOpen(true)}>
            Import CSV
          </button>
        </div>
        <div className="text-sm text-slate-300">Total: {stats.total} | Active: {stats.active} | Hits: {stats.hits}</div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4">
        <table className="w-full text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="text-left py-2">From</th>
              <th className="text-left py-2">To</th>
              <th className="text-left py-2">Code</th>
              <th className="text-left py-2">Hits</th>
              <th className="text-left py-2">Status</th>
              <th className="text-left py-2">Created</th>
              <th className="text-left py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-slate-300 py-4">Se incarca...</td></tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-slate-700">
                  <td className="py-2 text-slate-200">{item.fromPath}</td>
                  <td className="py-2 text-slate-200">{item.toPath}</td>
                  <td className="py-2">
                    <span className="px-2 py-1 rounded bg-slate-800 text-slate-200">{item.statusCode}</span>
                  </td>
                  <td className="py-2 text-slate-200">{item.hits}</td>
                  <td className="py-2">
                    <button
                      onClick={() => toggle(item.id)}
                      className={`px-2 py-1 rounded ${item.isActive ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-200'}`}
                    >
                      {item.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="py-2 text-slate-400">{new Date(item.createdAt).toLocaleDateString('ro-RO')}</td>
                  <td className="py-2">
                    <button className="px-2 py-1 rounded bg-rose-600 text-white" onClick={() => remove(item.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3 text-slate-300">
        <button disabled={page <= 1} onClick={() => loadData(page - 1)} className="px-3 py-1 rounded bg-slate-800 disabled:opacity-50">
          Anterior
        </button>
        <span>
          Pagina {page} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}
        </span>
        <button
          disabled={page >= Math.ceil(total / PAGE_SIZE)}
          onClick={() => loadData(page + 1)}
          className="px-3 py-1 rounded bg-slate-800 disabled:opacity-50"
        >
          Urmator
        </button>
      </div>

      {csvOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f172a] border border-slate-700 rounded-xl w-full max-w-lg p-4 space-y-3">
            <h3 className="text-white font-semibold">Import CSV</h3>
            <p className="text-xs text-slate-400">Format: fromPath,toPath,statusCode</p>
            <textarea value={csvText} onChange={(e) => setCsvText(e.target.value)} rows={8} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2" />
            <div className="flex gap-2 justify-end">
              <button className="px-3 py-2 rounded bg-slate-700 text-white" onClick={() => setCsvOpen(false)}>
                Renunta
              </button>
              <button className="px-3 py-2 rounded bg-[#8b5cf6] text-white" onClick={importCsv}>
                Importa
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
