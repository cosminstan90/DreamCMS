'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

type Category = { id: string; name: string }

type PostRow = {
  id: string
  title: string
  postType: 'ARTICLE' | 'DREAM_INTERPRETATION' | 'SYMBOL'
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED'
  updatedAt: string
  category?: { name: string } | null
  author: { name?: string | null; email?: string | null }
}

const statusClasses: Record<string, string> = {
  DRAFT: 'bg-slate-500/20 text-slate-300 border border-slate-500/30',
  REVIEW: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  PUBLISHED: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  ARCHIVED: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
}

const postTypeClasses: Record<string, string> = {
  ARTICLE: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  DREAM_INTERPRETATION: 'bg-violet-500/20 text-violet-300 border border-violet-500/30',
  SYMBOL: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
}

export const dynamic = 'force-dynamic'

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<PostRow[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const [status, setStatus] = useState('')
  const [postType, setPostType] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [search, setSearch] = useState('')

  const query = useMemo(() => {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (postType) params.set('postType', postType)
    if (categoryId) params.set('categoryId', categoryId)
    if (search) params.set('search', search)
    params.set('limit', '50')
    return params.toString()
  }, [status, postType, categoryId, search])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [postsRes, catsRes] = await Promise.all([
        fetch(`/api/posts?${query}`),
        fetch('/api/categories?limit=200'),
      ])

      const postsJson = await postsRes.json()
      const catsJson = await catsRes.json()

      setPosts(Array.isArray(postsJson.data) ? postsJson.data : [])
      setCategories(Array.isArray(catsJson.data) ? catsJson.data : [])
      setSelected([])
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function runBulk(action: 'publish' | 'archive' | 'delete') {
    if (selected.length === 0) return

    if (action === 'delete') {
      await Promise.all(selected.map((id) => fetch(`/api/posts/${id}`, { method: 'DELETE' })))
    }

    if (action === 'publish') {
      await Promise.all(selected.map((id) => fetch(`/api/posts/${id}/publish`, { method: 'POST' })))
    }

    if (action === 'archive') {
      await Promise.all(
        selected.map((id) =>
          fetch(`/api/posts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'ARCHIVED' }),
          }),
        ),
      )
    }

    await loadData()
  }

  const allSelected = posts.length > 0 && selected.length === posts.length

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold text-white">Articole</h2>
        <Link href="/admin/posts/new" className="px-4 py-2 rounded-lg bg-[#8b5cf6] hover:bg-[#7c3aed] text-white">
          + Articol Nou
        </Link>
      </div>

      <div className="bg-[#1e293b] border border-slate-700 rounded-xl p-4 grid grid-cols-1 md:grid-cols-5 gap-3">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2">
          <option value="">Toate statusurile</option>
          <option value="DRAFT">DRAFT</option>
          <option value="REVIEW">REVIEW</option>
          <option value="PUBLISHED">PUBLISHED</option>
          <option value="ARCHIVED">ARCHIVED</option>
        </select>

        <select value={postType} onChange={(e) => setPostType(e.target.value)} className="bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2">
          <option value="">Toate tipurile</option>
          <option value="ARTICLE">ARTICLE</option>
          <option value="DREAM_INTERPRETATION">DREAM</option>
          <option value="SYMBOL">SYMBOL</option>
        </select>

        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2">
          <option value="">Toate categoriile</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cauta in titlu/continut"
          className="md:col-span-2 bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2"
        />
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => runBulk('publish')} className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm">
          Bulk Publish
        </button>
        <button onClick={() => runBulk('archive')} className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white text-sm">
          Bulk Archive
        </button>
        <button onClick={() => runBulk('delete')} className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-sm">
          Bulk Delete
        </button>
      </div>

      <div className="overflow-x-auto bg-[#1e293b] border border-slate-700 rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-[#0f172a] text-slate-300">
            <tr>
              <th className="px-3 py-3 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) =>
                    setSelected(e.target.checked ? posts.map((post) => post.id) : [])
                  }
                />
              </th>
              <th className="px-3 py-3 text-left">Title</th>
              <th className="px-3 py-3 text-left">PostType</th>
              <th className="px-3 py-3 text-left">Category</th>
              <th className="px-3 py-3 text-left">Status</th>
              <th className="px-3 py-3 text-left">Author</th>
              <th className="px-3 py-3 text-left">Updated</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="px-3 py-6 text-slate-400" colSpan={7}>
                  Se incarca...
                </td>
              </tr>
            )}
            {!loading &&
              posts.map((post) => (
                <tr key={post.id} className="border-t border-slate-700 hover:bg-slate-800/50">
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(post.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelected((prev) => [...prev, post.id])
                        else setSelected((prev) => prev.filter((id) => id !== post.id))
                      }}
                    />
                  </td>
                  <td className="px-3 py-3">
                    <Link className="text-violet-300 hover:text-violet-200" href={`/admin/posts/${post.id}`}>
                      {post.title}
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${postTypeClasses[post.postType] || ''}`}>{post.postType}</span>
                  </td>
                  <td className="px-3 py-3">{post.category?.name || '-'}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${statusClasses[post.status] || ''}`}>{post.status}</span>
                  </td>
                  <td className="px-3 py-3">{post.author?.name || post.author?.email || '-'}</td>
                  <td className="px-3 py-3">{new Date(post.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
