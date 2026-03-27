'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

type SymbolRow = {
  id: string
  name: string
  slug: string
  letter: string
  publishedAt?: string | null
  updatedAt: string
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export const dynamic = 'force-dynamic'

export default function SymbolsPage() {
  const [symbols, setSymbols] = useState<SymbolRow[]>([])
  const [index, setIndex] = useState<Record<string, number>>({})
  const [letter, setLetter] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const query = useMemo(() => {
    const params = new URLSearchParams({ limit: '100' })
    if (letter) params.set('letter', letter)
    if (search) params.set('search', search)
    return params.toString()
  }, [letter, search])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [symbolsRes, indexRes] = await Promise.all([fetch(`/api/symbols?${query}`), fetch('/api/symbols/index')])
      const symbolsJson = await symbolsRes.json()
      const indexJson = await indexRes.json()
      setSymbols(Array.isArray(symbolsJson.data) ? symbolsJson.data : [])
      setIndex(indexJson || {})
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold text-white">Dictionar Simboluri</h2>
        <Link href="/admin/symbols/new" className="px-4 py-2 rounded-lg bg-[#8b5cf6] hover:bg-[#7c3aed] text-white">
          + Simbol Nou
        </Link>
      </div>

      <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setLetter('')}
            className={`px-2 py-1 rounded text-xs border ${letter === '' ? 'bg-[#8b5cf6]/20 border-[#8b5cf6]/30 text-violet-200' : 'border-slate-700 text-slate-300'}`}
          >
            Toate
          </button>
          {LETTERS.map((item) => (
            <button
              key={item}
              onClick={() => setLetter(item)}
              className={`px-2 py-1 rounded text-xs border ${
                letter === item ? 'bg-[#8b5cf6]/20 border-[#8b5cf6]/30 text-violet-200' : 'border-slate-700 text-slate-300'
              }`}
            >
              {item} ({index[item] || 0})
            </button>
          ))}
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2"
          placeholder="Cauta simbol"
        />
      </div>

      <div className="overflow-x-auto bg-[#1e293b] border border-slate-700 rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-[#0f172a] text-slate-300">
            <tr>
              <th className="px-3 py-3 text-left">Name</th>
              <th className="px-3 py-3 text-left">Letter</th>
              <th className="px-3 py-3 text-left">Status</th>
              <th className="px-3 py-3 text-left">Updated</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="px-3 py-6 text-slate-400" colSpan={4}>
                  Se incarca...
                </td>
              </tr>
            )}
            {!loading &&
              symbols.map((row) => (
                <tr key={row.id} className="border-t border-slate-700 hover:bg-slate-800/50">
                  <td className="px-3 py-3">
                    <Link href={`/admin/symbols/${row.id}`} className="text-violet-300 hover:text-violet-200">
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-flex px-2 py-1 rounded bg-slate-700 text-slate-100 text-xs">{row.letter}</span>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex px-2 py-1 rounded text-xs ${
                        row.publishedAt
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                      }`}
                    >
                      {row.publishedAt ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </td>
                  <td className="px-3 py-3">{new Date(row.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
