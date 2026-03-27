/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useMemo, useState } from 'react'

type MediaItem = {
  id: string
  originalName: string
  url: string
  urlOriginal?: string | null
  altText?: string | null
  width?: number | null
  height?: number | null
  urls?: { webp?: string | null; thumbnail?: string | null; ogImage?: string | null; original?: string | null }
}

type MediaPickerProps = {
  open: boolean
  onClose: () => void
  onSelect: (item: MediaItem & { urls: { webp: string; thumbnail?: string | null; ogImage?: string | null; original?: string | null } }) => void
  mode?: 'single'
}

const PAGE_SIZE = 24

export function MediaPicker({ open, onClose, onSelect }: MediaPickerProps) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'library' | 'upload'>('library')
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  async function fetchMedia(nextPage = page) {
    setLoading(true)
    const res = await fetch(`/api/media?page=${nextPage}&limit=${PAGE_SIZE}&type=image`)
    const json = await res.json()
    setItems(json.data || [])
    setTotal(json.total || 0)
    setPage(nextPage)
    setLoading(false)
  }

  useEffect(() => {
    if (open && tab === 'library') fetchMedia(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab])

  const pages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total])

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    await fetch('/api/media/upload', { method: 'POST', body: fd })
    setUploading(false)
    setFile(null)
    setTab('library')
    fetchMedia(1)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-[#0f172a] border border-slate-700 rounded-xl p-4 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button
              className={`px-3 py-2 rounded ${tab === 'library' ? 'bg-[#8b5cf6] text-white' : 'bg-slate-800 text-slate-200'}`}
              onClick={() => setTab('library')}
            >
              Library
            </button>
            <button
              className={`px-3 py-2 rounded ${tab === 'upload' ? 'bg-[#8b5cf6] text-white' : 'bg-slate-800 text-slate-200'}`}
              onClick={() => setTab('upload')}
            >
              Upload
            </button>
          </div>
          <button className="text-slate-300" onClick={onClose}>
            Inchide
          </button>
        </div>

        {tab === 'library' && (
          <div className="space-y-3">
            {loading ? (
              <div className="text-slate-300">Se incarca...</div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {items.map((item) => {
                  const urls = item.urls || { webp: item.url, thumbnail: item.url }
                  const payload = {
                    ...item,
                    urls: {
                      webp: urls.webp || item.url,
                      thumbnail: urls.thumbnail,
                      ogImage: urls.ogImage,
                      original: urls.original,
                    },
                  }
                  return (
                    <button
                      key={item.id}
                      className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900 hover:border-[#8b5cf6]"
                      onClick={() => onSelect(payload)}
                    >
                      <img src={urls.thumbnail || item.url} alt={item.altText || ''} className="aspect-square w-full object-cover" loading="lazy" />
                      <div className="p-2 text-left text-xs text-slate-300 truncate">{item.originalName}</div>
                    </button>
                  )
                })}
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-300">
              <button disabled={page <= 1} onClick={() => fetchMedia(page - 1)} className="px-3 py-1 rounded bg-slate-800 disabled:opacity-50">
                Prev
              </button>
              <span>
                {page}/{pages}
              </span>
              <button disabled={page >= pages} onClick={() => fetchMedia(page + 1)} className="px-3 py-1 rounded bg-slate-800 disabled:opacity-50">
                Next
              </button>
            </div>
          </div>
        )}

        {tab === 'upload' && (
          <div className="space-y-3">
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <button
              className="px-4 py-2 rounded bg-[#8b5cf6] text-white disabled:opacity-50"
              disabled={!file || uploading}
              onClick={handleUpload}
            >
              {uploading ? 'Se incarca...' : 'Urca imaginea'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
