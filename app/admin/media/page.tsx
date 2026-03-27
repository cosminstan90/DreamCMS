/* eslint-disable @next/next/no-img-element */
"use client"

import { useEffect, useMemo, useRef, useState } from 'react'

const PAGE_SIZE = 40

type MediaItem = {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  width: number | null
  height: number | null
  url: string
  urlOriginal: string | null
  altText: string | null
  caption: string | null
  urls?: { webp?: string | null; thumbnail?: string | null; ogImage?: string | null; original?: string | null }
}

function humanSize(bytes: number) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`
}

export default function MediaLibraryPage() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [type, setType] = useState<'all' | 'image'>('image')
  const [selected, setSelected] = useState<MediaItem | null>(null)
  const [altText, setAltText] = useState('')
  const [caption, setCaption] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  async function fetchMedia(nextPage = page) {
    setLoading(true)
    const params = new URLSearchParams({ page: String(nextPage), limit: String(PAGE_SIZE) })
    if (type === 'image') params.set('type', 'image')
    const res = await fetch(`/api/media?${params.toString()}`)
    const json = await res.json()
    setItems(json.data || [])
    setTotal(json.total || 0)
    setPage(nextPage)
    setLoading(false)
  }

  useEffect(() => {
    fetchMedia(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type])

  const filtered = useMemo(() => {
    if (!search) return items
    const q = search.toLowerCase()
    return items.filter((item) =>
      item.originalName.toLowerCase().includes(q) || (item.altText || '').toLowerCase().includes(q) || (item.caption || '').toLowerCase().includes(q),
    )
  }, [items, search])

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return
    setLoading(true)
    const file = files[0]
    const fd = new FormData()
    fd.append('file', file)
    await fetch('/api/media/upload', { method: 'POST', body: fd })
    await fetchMedia(1)
    setLoading(false)
  }

  async function saveMeta() {
    if (!selected) return
    await fetch(`/api/media/${selected.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ altText, caption }),
    })
    await fetchMedia(page)
    setSelected(null)
  }

  async function deleteMedia() {
    if (!selected) return
    const ok = window.confirm('Stergi definitiv acest fisier?')
    if (!ok) return
    const res = await fetch(`/api/media/${selected.id}`, { method: 'DELETE' })
    if (res.ok) {
      await fetchMedia(page)
      setSelected(null)
    } else {
      const json = await res.json()
      alert(json.error || 'Nu s-a putut sterge')
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex gap-2">
          <button
            className="px-4 py-2 rounded-lg bg-[#8b5cf6] text-white"
            onClick={() => fileInput.current?.click()}
          >
            Upload
          </button>
          <input ref={fileInput} type="file" className="hidden" onChange={(e) => handleUpload(e.target.files)} />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'all' | 'image')}
            className="px-3 py-2 rounded-lg bg-[#0f172a] border border-slate-700 text-slate-200"
          >
            <option value="image">Imagini</option>
            <option value="all">Toate</option>
          </select>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cauta dupa nume/alt/caption"
          className="w-64 px-3 py-2 rounded-lg bg-[#0f172a] border border-slate-700 text-slate-200"
        />
      </div>

      <div
        className="border border-dashed border-slate-700 rounded-xl p-6 text-center text-slate-300"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          handleUpload(e.dataTransfer.files)
        }}
      >
        Trage fisiere aici sau foloseste butonul Upload.
      </div>

      {loading ? (
        <div className="text-slate-300">Se incarca media...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((item) => (
            <button
              key={item.id}
              className="rounded-xl overflow-hidden border border-slate-700 bg-[#0f172a] hover:border-[#8b5cf6]"
              onClick={() => {
                setSelected(item)
                setAltText(item.altText || '')
                setCaption(item.caption || '')
              }}
            >
              <img src={item.urls?.thumbnail || item.url} alt={item.altText || ''} className="aspect-square w-full object-cover" loading="lazy" />
              <div className="p-2 text-left text-xs text-slate-300 truncate">{item.originalName}</div>
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 text-slate-300">
        <button disabled={page <= 1} onClick={() => fetchMedia(page - 1)} className="px-3 py-1 rounded bg-slate-800 disabled:opacity-50">
          Anterior
        </button>
        <span>
          Pagina {page} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}
        </span>
        <button
          disabled={page >= Math.ceil(total / PAGE_SIZE)}
          onClick={() => fetchMedia(page + 1)}
          className="px-3 py-1 rounded bg-slate-800 disabled:opacity-50"
        >
          Urmator
        </button>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f172a] border border-slate-700 rounded-xl w-full max-w-3xl p-4 space-y-3">
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1">
                <img src={selected.url} alt={selected.altText || ''} className="w-full max-h-[360px] object-contain bg-slate-900 rounded" />
              </div>
              <div className="w-64 space-y-2 text-sm text-slate-200">
                <div className="text-xs text-slate-400">Dimensiuni: {selected.width}x{selected.height}</div>
                <div className="text-xs text-slate-400">Marime: {humanSize(selected.size)}</div>
                <button
                  className="w-full px-3 py-2 rounded bg-slate-800 text-slate-200"
                  onClick={() => navigator.clipboard.writeText(selected.url)}
                >
                  Copy URL
                </button>
                <button
                  className="w-full px-3 py-2 rounded bg-rose-600 text-white"
                  onClick={deleteMedia}
                >
                  Sterge
                </button>
                <button className="w-full px-3 py-2 rounded bg-slate-700 text-white" onClick={() => setSelected(null)}>
                  Inchide
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400">Alt text</label>
                <input
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Caption</label>
                <input
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 rounded bg-slate-800 text-white" onClick={() => setSelected(null)}>
                Renunta
              </button>
              <button className="px-4 py-2 rounded bg-[#8b5cf6] text-white" onClick={saveMeta}>
                Salveaza
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
