'use client'

import { FormEvent, useEffect, useState } from 'react'

type CategoryNode = {
  id: string
  name: string
  slug: string
  parentId?: string | null
  _count?: { posts: number }
  children?: CategoryNode[]
}

export const dynamic = 'force-dynamic'

export default function CategoriesPage() {
  const [tree, setTree] = useState<CategoryNode[]>([])
  const [flat, setFlat] = useState<CategoryNode[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [editing, setEditing] = useState<CategoryNode | null>(null)
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState('')
  const [description, setDescription] = useState('')

  async function loadData() {
    const [treeRes, listRes] = await Promise.all([fetch('/api/categories/tree'), fetch('/api/categories?limit=500')])
    const treeJson = await treeRes.json()
    const listJson = await listRes.json()
    setTree(Array.isArray(treeJson) ? treeJson : [])
    setFlat(Array.isArray(listJson.data) ? listJson.data : [])
  }

  useEffect(() => {
    loadData()
  }, [])

  function openCreate(parent?: CategoryNode) {
    setEditing(null)
    setName('')
    setDescription('')
    setParentId(parent?.id || '')
    setIsOpen(true)
  }

  function openEdit(node: CategoryNode) {
    setEditing(node)
    setName(node.name)
    setDescription('')
    setParentId(node.parentId || '')
    setIsOpen(true)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()

    const payload = {
      name,
      description,
      parentId: parentId || null,
      slug: editing?.slug,
    }

    if (editing) {
      await fetch(`/api/categories/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }

    setIsOpen(false)
    await loadData()
  }

  async function onDelete(id: string) {
    await fetch(`/api/categories/${id}`, { method: 'DELETE' })
    await loadData()
  }

  function renderTree(nodes: CategoryNode[], level = 0) {
    return nodes.map((node) => (
      <div key={node.id} className="space-y-2">
        <div
          className="flex items-center justify-between bg-[#1e293b] border border-slate-700 rounded-lg p-3"
          style={{ marginLeft: `${level * 16}px` }}
        >
          <div>
            <div className="text-white font-medium">{node.name}</div>
            <div className="text-xs text-slate-400">
              /{node.slug} - {node._count?.posts || 0} articole
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => openCreate(node)} className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600">
              Add child
            </button>
            <button onClick={() => openEdit(node)} className="px-2 py-1 text-xs rounded bg-[#8b5cf6] hover:bg-[#7c3aed] text-white">
              Edit
            </button>
            <button onClick={() => onDelete(node.id)} className="px-2 py-1 text-xs rounded bg-rose-600 hover:bg-rose-700 text-white">
              Delete
            </button>
          </div>
        </div>

        {!!node.children?.length && renderTree(node.children, level + 1)}
      </div>
    ))
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-white">Categorii</h2>
        <button onClick={() => openCreate()} className="px-4 py-2 rounded-lg bg-[#8b5cf6] hover:bg-[#7c3aed] text-white">
          + Categorie
        </button>
      </div>

      <div className="space-y-3">{renderTree(tree)}</div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={onSubmit} className="w-full max-w-lg bg-[#1e293b] border border-slate-700 rounded-xl p-5 space-y-4">
            <h3 className="text-lg text-white font-semibold">{editing ? 'Editeaza categorie' : 'Adauga categorie'}</h3>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Nume"
              className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2"
            />

            <select value={parentId} onChange={(e) => setParentId(e.target.value)} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2">
              <option value="">Fara parinte</option>
              {flat.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descriere"
              rows={3}
              className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2"
            />

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsOpen(false)} className="px-3 py-2 rounded-lg border border-slate-700 text-slate-200">
                Anuleaza
              </button>
              <button type="submit" className="px-3 py-2 rounded-lg bg-[#8b5cf6] hover:bg-[#7c3aed] text-white">
                Salveaza
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}
