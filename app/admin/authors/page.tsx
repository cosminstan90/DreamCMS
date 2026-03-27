'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

type AuthorRow = {
  id: string
  email: string
  name: string | null
  slug: string | null
  headline: string | null
  bio: string | null
  credentials: string | null
  methodology: string | null
  expertise: string[] | null
  avatarUrl: string | null
  trustStatement: string | null
  publicProfile: boolean
  role: string
}

type EditableAuthor = AuthorRow & { expertiseText: string }

export const dynamic = 'force-dynamic'

export default function AuthorsAdminPage() {
  const [authors, setAuthors] = useState<AuthorRow[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<EditableAuthor | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const loadAuthors = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users')
      const json = await res.json()
      const nextAuthors = Array.isArray(json) ? json : []
      setAuthors(nextAuthors)
      const current = nextAuthors.find((item: AuthorRow) => item.id === selectedId) || nextAuthors[0] || null
      setSelectedId(current?.id || null)
      setDraft(
        current
          ? {
              ...current,
              expertiseText: Array.isArray(current.expertise) ? current.expertise.join(', ') : '',
            }
          : null,
      )
    } finally {
      setLoading(false)
    }
  }, [selectedId])

  useEffect(() => {
    loadAuthors()
  }, [loadAuthors])

  const selectedAuthor = useMemo(
    () => authors.find((item) => item.id === selectedId) || null,
    [authors, selectedId],
  )

  useEffect(() => {
    if (!selectedAuthor) return
    setDraft({
      ...selectedAuthor,
      expertiseText: Array.isArray(selectedAuthor.expertise) ? selectedAuthor.expertise.join(', ') : '',
    })
  }, [selectedAuthor])

  async function save() {
    if (!draft) return
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/users/${draft.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: draft.name,
          role: draft.role,
          slug: draft.slug,
          headline: draft.headline,
          bio: draft.bio,
          credentials: draft.credentials,
          methodology: draft.methodology,
          expertise: draft.expertiseText.split(',').map((item) => item.trim()).filter(Boolean),
          avatarUrl: draft.avatarUrl,
          trustStatement: draft.trustStatement,
          publicProfile: draft.publicProfile,
        }),
      })
      const json = await res.json()
      setMessage(res.ok ? 'Profilul autorului a fost salvat.' : json.error || 'Nu am putut salva profilul.')
      await loadAuthors()
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-slate-300">Se incarca autorii...</div>

  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_1fr]">
      <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4">
        <h1 className="mb-4 text-lg font-semibold text-white">Autori</h1>
        <div className="space-y-2">
          {authors.map((author) => (
            <button
              key={author.id}
              type="button"
              onClick={() => setSelectedId(author.id)}
              className={`w-full rounded-lg border px-3 py-3 text-left ${
                selectedId === author.id
                  ? 'border-violet-500 bg-violet-500/10 text-white'
                  : 'border-slate-700 bg-[#0f172a] text-slate-200'
              }`}
            >
              <div className="font-medium">{author.name || author.email}</div>
              <div className="mt-1 text-xs text-slate-400">{author.publicProfile ? 'Public' : 'Privat'} - {author.role}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-6">
        {!draft ? (
          <div className="text-slate-400">Selecteaza un autor.</div>
        ) : (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Profil public autor</h2>
              <p className="mt-1 text-sm text-slate-400">Aceste date apar pe pagina publica de autor si in trust layer-ul din articole.</p>
            </div>

            {message && <div className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-3 text-sm text-violet-100">{message}</div>}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input value={draft.name || ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Nume" className="rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2 text-slate-100" />
              <input value={draft.slug || ''} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} placeholder="Slug public" className="rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2 text-slate-100" />
              <input value={draft.headline || ''} onChange={(e) => setDraft({ ...draft, headline: e.target.value })} placeholder="Headline" className="rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2 text-slate-100 md:col-span-2" />
              <input value={draft.avatarUrl || ''} onChange={(e) => setDraft({ ...draft, avatarUrl: e.target.value })} placeholder="Avatar URL" className="rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2 text-slate-100 md:col-span-2" />
            </div>

            <textarea value={draft.bio || ''} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} rows={5} placeholder="Bio publica" className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2 text-slate-100" />
            <textarea value={draft.credentials || ''} onChange={(e) => setDraft({ ...draft, credentials: e.target.value })} rows={3} placeholder="Credentials / experienta" className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2 text-slate-100" />
            <textarea value={draft.methodology || ''} onChange={(e) => setDraft({ ...draft, methodology: e.target.value })} rows={4} placeholder="Metodologie editoriala" className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2 text-slate-100" />
            <textarea value={draft.trustStatement || ''} onChange={(e) => setDraft({ ...draft, trustStatement: e.target.value })} rows={3} placeholder="Trust statement" className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2 text-slate-100" />
            <input value={draft.expertiseText} onChange={(e) => setDraft({ ...draft, expertiseText: e.target.value })} placeholder="Expertise (separate prin virgula)" className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2 text-slate-100" />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} className="rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2 text-slate-100">
                <option value="ADMIN">ADMIN</option>
                <option value="EDITOR">EDITOR</option>
              </select>
              <label className="flex items-center gap-2 rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2 text-sm text-slate-200">
                <input type="checkbox" checked={draft.publicProfile} onChange={(e) => setDraft({ ...draft, publicProfile: e.target.checked })} />
                Publica profilul in frontend
              </label>
            </div>

            <button type="button" onClick={save} className="rounded-lg bg-[#8b5cf6] px-4 py-2 text-white">
              {saving ? 'Se salveaza...' : 'Salveaza profil autor'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
