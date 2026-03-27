'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

type Product = {
  id: string
  title: string
  slug: string
  merchant: string | null
  network: string | null
  affiliateUrl: string
  image: string | null
  priceText: string | null
  badge: string | null
  category: string | null
  active: boolean
  priority: number
  relatedKeywords: string[] | null
  relatedSymbols: string[] | null
  relatedCategories: string[] | null
  clicks: number
  placements: number
}

type FormState = {
  id: string
  title: string
  slug: string
  merchant: string
  network: string
  affiliateUrl: string
  image: string
  priceText: string
  badge: string
  category: string
  active: boolean
  priority: number
  relatedKeywords: string
  relatedSymbols: string
  relatedCategories: string
}

const emptyForm: FormState = {
  id: '',
  title: '',
  slug: '',
  merchant: '',
  network: '',
  affiliateUrl: '',
  image: '',
  priceText: '',
  badge: '',
  category: '',
  active: true,
  priority: 0,
  relatedKeywords: '',
  relatedSymbols: '',
  relatedCategories: '',
}

export default function AffiliateAdminPage() {
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [message, setMessage] = useState('')
  const [form, setForm] = useState<FormState>(emptyForm)
  const [topClicked, setTopClicked] = useState<Product[]>([])
  const [neverShown, setNeverShown] = useState<Product[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query.trim()) params.set('search', query.trim())
      if (status === 'active') params.set('active', 'true')
      if (status === 'inactive') params.set('active', 'false')

      const res = await fetch(`/api/affiliate-products?${params.toString()}`)
      const json = await res.json()
      setItems(Array.isArray(json.data) ? json.data : [])
      setTopClicked(Array.isArray(json.insights?.topClicked) ? json.insights.topClicked : [])
      setNeverShown(Array.isArray(json.insights?.neverShown) ? json.insights.neverShown : [])
    } finally {
      setLoading(false)
    }
  }, [query, status])

  useEffect(() => {
    load()
  }, [load])

  const totalClicks = useMemo(() => items.reduce((acc, item) => acc + (item.clicks || 0), 0), [items])

  async function submit() {
    setSaving(true)
    setMessage('')
    try {
      const payload = {
        ...form,
        relatedKeywords: form.relatedKeywords,
        relatedSymbols: form.relatedSymbols,
        relatedCategories: form.relatedCategories,
      }

      const method = form.id ? 'PUT' : 'POST'
      const endpoint = form.id ? `/api/affiliate-products/${form.id}` : '/api/affiliate-products'
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) {
        setMessage(json.error || 'Nu am putut salva produsul.')
        return
      }

      setForm(emptyForm)
      setMessage('Produs salvat.')
      await load()
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('Stergi produsul affiliate?')) return
    const res = await fetch(`/api/affiliate-products/${id}`, { method: 'DELETE' })
    if (!res.ok) return
    await load()
  }

  return (
    <section className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4">
          <div className="text-xs text-slate-400">Produse</div>
          <div className="text-2xl font-semibold text-white">{items.length}</div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4">
          <div className="text-xs text-slate-400">Clickuri</div>
          <div className="text-2xl font-semibold text-white">{totalClicks}</div>
        </div>
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4">
          <div className="text-xs text-slate-400">Niciodata afisate</div>
          <div className="text-2xl font-semibold text-white">{neverShown.length}</div>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-700 bg-[#1e293b] p-4">
        <h1 className="text-xl font-semibold text-white">Affiliate Products</h1>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cauta produs" className="rounded border border-slate-700 bg-[#0f172a] px-3 py-2" />
          <select value={status} onChange={(e) => setStatus(e.target.value as 'all' | 'active' | 'inactive')} className="rounded border border-slate-700 bg-[#0f172a] px-3 py-2">
            <option value="all">Toate</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button onClick={load} className="rounded bg-[#8b5cf6] px-3 py-2 text-white">Filtreaza</button>
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-700 bg-[#1e293b] p-4">
        <h2 className="text-lg font-semibold text-white">{form.id ? 'Editeaza produs' : 'Produs nou'}</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Titlu" className="rounded border border-slate-700 bg-[#0f172a] px-3 py-2" />
          <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Slug (optional)" className="rounded border border-slate-700 bg-[#0f172a] px-3 py-2" />
          <input value={form.affiliateUrl} onChange={(e) => setForm({ ...form, affiliateUrl: e.target.value })} placeholder="Affiliate URL" className="rounded border border-slate-700 bg-[#0f172a] px-3 py-2 md:col-span-2" />
          <input value={form.merchant} onChange={(e) => setForm({ ...form, merchant: e.target.value })} placeholder="Merchant" className="rounded border border-slate-700 bg-[#0f172a] px-3 py-2" />
          <input value={form.network} onChange={(e) => setForm({ ...form, network: e.target.value })} placeholder="Network" className="rounded border border-slate-700 bg-[#0f172a] px-3 py-2" />
          <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="Image URL" className="rounded border border-slate-700 bg-[#0f172a] px-3 py-2 md:col-span-2" />
          <input value={form.priceText} onChange={(e) => setForm({ ...form, priceText: e.target.value })} placeholder="Price text" className="rounded border border-slate-700 bg-[#0f172a] px-3 py-2" />
          <input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="Badge" className="rounded border border-slate-700 bg-[#0f172a] px-3 py-2" />
          <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category" className="rounded border border-slate-700 bg-[#0f172a] px-3 py-2" />
          <input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} placeholder="Priority" className="rounded border border-slate-700 bg-[#0f172a] px-3 py-2" />
          <input value={form.relatedKeywords} onChange={(e) => setForm({ ...form, relatedKeywords: e.target.value })} placeholder="Related keywords (comma)" className="rounded border border-slate-700 bg-[#0f172a] px-3 py-2 md:col-span-2" />
          <input value={form.relatedSymbols} onChange={(e) => setForm({ ...form, relatedSymbols: e.target.value })} placeholder="Related symbols (comma)" className="rounded border border-slate-700 bg-[#0f172a] px-3 py-2 md:col-span-2" />
          <input value={form.relatedCategories} onChange={(e) => setForm({ ...form, relatedCategories: e.target.value })} placeholder="Related categories (comma)" className="rounded border border-slate-700 bg-[#0f172a] px-3 py-2 md:col-span-2" />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-200">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
          Activ
        </label>

        <div className="flex gap-2">
          <button onClick={submit} className="rounded bg-[#8b5cf6] px-4 py-2 text-white">{saving ? 'Se salveaza...' : 'Salveaza'}</button>
          {form.id && <button onClick={() => setForm(emptyForm)} className="rounded bg-slate-700 px-4 py-2 text-slate-100">Reset</button>}
        </div>
        {message && <div className="text-sm text-slate-300">{message}</div>}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4">
          <h3 className="mb-2 font-semibold text-white">Top clicked</h3>
          <div className="space-y-2 text-sm">
            {topClicked.map((item) => (
              <div key={item.id} className="flex justify-between text-slate-200">
                <span>{item.title}</span>
                <span>{item.clicks}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4">
          <h3 className="mb-2 font-semibold text-white">Never shown</h3>
          <div className="space-y-2 text-sm">
            {neverShown.map((item) => (
              <div key={item.id} className="text-slate-200">{item.title}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4">
        <h2 className="mb-3 text-lg font-semibold text-white">Produse</h2>
        {loading ? (
          <div className="text-slate-400">Se incarca...</div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-slate-400">
                  <th className="px-2 py-2">Title</th>
                  <th className="px-2 py-2">Category</th>
                  <th className="px-2 py-2">Active</th>
                  <th className="px-2 py-2">Priority</th>
                  <th className="px-2 py-2">Clicks</th>
                  <th className="px-2 py-2">Placements</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-700 text-slate-200">
                    <td className="px-2 py-2">{item.title}</td>
                    <td className="px-2 py-2">{item.category || '-'}</td>
                    <td className="px-2 py-2">{item.active ? 'Yes' : 'No'}</td>
                    <td className="px-2 py-2">{item.priority}</td>
                    <td className="px-2 py-2">{item.clicks}</td>
                    <td className="px-2 py-2">{item.placements}</td>
                    <td className="space-x-2 px-2 py-2">
                      <button
                        onClick={() =>
                          setForm({
                            id: item.id,
                            title: item.title,
                            slug: item.slug,
                            merchant: item.merchant || '',
                            network: item.network || '',
                            affiliateUrl: item.affiliateUrl,
                            image: item.image || '',
                            priceText: item.priceText || '',
                            badge: item.badge || '',
                            category: item.category || '',
                            active: item.active,
                            priority: item.priority,
                            relatedKeywords: Array.isArray(item.relatedKeywords) ? item.relatedKeywords.join(', ') : '',
                            relatedSymbols: Array.isArray(item.relatedSymbols) ? item.relatedSymbols.join(', ') : '',
                            relatedCategories: Array.isArray(item.relatedCategories) ? item.relatedCategories.join(', ') : '',
                          })
                        }
                        className="rounded bg-slate-700 px-2 py-1 text-xs"
                      >
                        Edit
                      </button>
                      <button onClick={() => remove(item.id)} className="rounded bg-rose-700 px-2 py-1 text-xs">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
