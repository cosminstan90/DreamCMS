'use client'

import { useEffect, useMemo, useState } from 'react'

type Suggestion = {
  id: string
  targetType: 'post' | 'symbol' | 'hub' | 'dream'
  title: string
  href: string
  anchorText: string
  relevance: number
  reasons: string[]
}

type InternalLinksPanelProps = {
  kind: 'post' | 'symbol'
  id?: string
  title: string
  slug: string
  contentHtml: string
  contentJson?: unknown
  focusKeyword?: string
  categoryId?: string
  categorySlug?: string
  postType?: string
  onInsert: (suggestion: Suggestion) => void
}

const TARGET_LABELS: Record<Suggestion['targetType'], string> = {
  post: 'Articol',
  dream: 'Interpretare vis',
  symbol: 'Simbol',
  hub: 'Hub',
}

export function InternalLinksPanel(props: InternalLinksPanelProps) {
  const { kind, id, title, slug, contentHtml, contentJson, focusKeyword, categoryId, categorySlug, postType, onInsert } = props
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentLinks, setCurrentLinks] = useState(0)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [dismissed, setDismissed] = useState<string[]>([])

  useEffect(() => {
    setDismissed([])
  }, [title, slug, contentHtml])

  useEffect(() => {
    if (!title.trim() || !contentHtml.trim()) {
      setSuggestions([])
      setCurrentLinks(0)
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/internal-links/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kind,
            id,
            title,
            slug,
            contentHtml,
            contentJson,
            focusKeyword,
            categoryId,
            categorySlug,
            postType,
            limit: 5,
          }),
          signal: controller.signal,
        })

        if (!res.ok) throw new Error('Failed')

        const json = await res.json()
        setSuggestions(Array.isArray(json.suggestions) ? json.suggestions : [])
        setCurrentLinks(typeof json.currentInternalLinks === 'number' ? json.currentInternalLinks : 0)
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setError('Sugestiile de linking nu sunt disponibile momentan.')
      } finally {
        setLoading(false)
      }
    }, 500)

    return () => {
      controller.abort()
      clearTimeout(timeout)
    }
  }, [kind, id, title, slug, contentHtml, contentJson, focusKeyword, categoryId, categorySlug, postType])

  const visibleSuggestions = useMemo(
    () => suggestions.filter((suggestion) => !dismissed.includes(suggestion.href)),
    [dismissed, suggestions],
  )

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-xl border border-slate-700 bg-[#1e293b] p-4">
        <h3 className="font-semibold text-white">Internal Links</h3>
        <div className={`text-sm ${currentLinks >= 2 ? 'text-emerald-400' : currentLinks === 1 ? 'text-amber-400' : 'text-rose-400'}`}>
          Linkuri interne curente: {currentLinks}
        </div>
        <div className="text-xs text-slate-400">
          Tinta recomandata: minim 2 linkuri interne utile pe fiecare pagina importanta. Sugestiile sunt limitate la 5 si prioritizeaza exact match + relevanta semantica.
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-slate-700 bg-[#1e293b] p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">Sugestii</h3>
          {loading && <span className="text-xs text-slate-400">Analizam...</span>}
        </div>

        {error && <div className="text-sm text-rose-400">{error}</div>}

        {!loading && !error && visibleSuggestions.length === 0 && (
          <div className="text-sm text-slate-400">
            Nu am gasit inca sugestii bune. Adauga mai mult context, mentioneaza explicit simboluri sau foloseste focus keyword mai clar.
          </div>
        )}

        <div className="space-y-3">
          {visibleSuggestions.map((suggestion) => (
            <div key={suggestion.href} className="rounded-lg border border-slate-700 bg-[#0f172a] p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-100">{suggestion.title}</div>
                  <div className="text-xs text-slate-400">{suggestion.href}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-800 px-2 py-1 text-[11px] text-slate-300">
                    {TARGET_LABELS[suggestion.targetType]}
                  </span>
                  <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-violet-200">
                    scor {suggestion.relevance}
                  </span>
                </div>
              </div>

              <div className="mt-2 text-xs text-slate-300">
                Anchor text: <span className="text-white">{suggestion.anchorText}</span>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {suggestion.reasons.map((reason) => (
                  <span key={reason} className="rounded-full bg-slate-800 px-2 py-1 text-[11px] text-slate-300">
                    {reason}
                  </span>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onInsert(suggestion)}
                  className="rounded-lg bg-[#8b5cf6] px-3 py-2 text-xs text-white hover:bg-[#7c3aed]"
                >
                  Insert
                </button>
                <button
                  type="button"
                  onClick={() => setDismissed((current) => [...current, suggestion.href])}
                  className="rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-200"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
