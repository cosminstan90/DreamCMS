'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { RevisionDrawer } from '@/components/editor/RevisionDrawer'
import { TiptapEditor } from '@/components/editor/TiptapEditor'
import { GeoPanel } from '@/components/seo/GeoPanel'
import { SeoPanel } from '@/components/seo/SeoPanel'
import { InternalLinksPanel } from '@/components/seo/InternalLinksPanel'
import { DEFAULT_EDITOR_PANELS, DEFAULT_SITE_EDITOR_FEATURES } from '@/lib/sites/editor-features'
import type { EditorPanelKey, SitePackEditorFeatures } from '@/lib/sites/types'

type SymbolRevision = {
  version: number
  savedAt: string
  userId: string
  name?: string
  shortDefinition?: string
  contentJson?: unknown
  fullContent?: string
  metaTitle?: string
  metaDescription?: string
}

type SymbolOption = { id: string; name: string; slug: string }

const TAB_LABELS: Record<EditorPanelKey, string> = {
  seo: 'SEO',
  geo: 'GEO/AEO',
  links: 'Links',
}

export const dynamic = 'force-dynamic'

export default function SymbolEditorPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params.id
  const isNew = id === 'new'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [activeSeoTab, setActiveSeoTab] = useState<EditorPanelKey>('seo')
  const [editorFeatures, setEditorFeatures] = useState<SitePackEditorFeatures>(DEFAULT_SITE_EDITOR_FEATURES)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [letter, setLetter] = useState('')
  const [shortDefinition, setShortDefinition] = useState('')
  const [status, setStatus] = useState('DRAFT')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [relatedSymbols, setRelatedSymbols] = useState<string[]>([])
  const [allSymbols, setAllSymbols] = useState<SymbolOption[]>([])
  const [contentJson, setContentJson] = useState<unknown>({ type: 'doc', content: [{ type: 'paragraph' }] })
  const [fullContent, setFullContent] = useState('')
  const [schemaMarkup, setSchemaMarkup] = useState<unknown[]>([])
  const [revisions, setRevisions] = useState<SymbolRevision[]>([])
  const [pendingLinkInsert, setPendingLinkInsert] = useState<{ key: number; href: string; label: string } | null>(null)

  const availableSeoTabs = editorFeatures.symbolPanels.length ? editorFeatures.symbolPanels : DEFAULT_EDITOR_PANELS

  useEffect(() => {
    if (availableSeoTabs.length > 0 && !availableSeoTabs.includes(activeSeoTab)) {
      setActiveSeoTab(availableSeoTabs[0])
    }
  }, [activeSeoTab, availableSeoTabs])

  useEffect(() => {
    setLetter(name ? name.charAt(0).toUpperCase() : '')
  }, [name])

  const loadEditorFeatures = useCallback(async () => {
    const res = await fetch('/api/sites/current')
    if (!res.ok) return
    const json = await res.json()
    const nextFeatures = json?.sitePack?.features?.editor
    if (nextFeatures) {
      setEditorFeatures(nextFeatures as SitePackEditorFeatures)
    }
  }, [])

  const loadSymbol = useCallback(async () => {
    if (isNew) return
    setLoading(true)
    try {
      const res = await fetch(`/api/symbols/${id}`)
      if (!res.ok) return
      const json = await res.json()
      setName(json.name || '')
      setSlug(json.slug || '')
      setLetter(json.letter || '')
      setShortDefinition(json.shortDefinition || '')
      setStatus(json.publishedAt ? 'PUBLISHED' : 'DRAFT')
      setMetaTitle(json.metaTitle || '')
      setMetaDescription(json.metaDescription || '')
      setRelatedSymbols(Array.isArray(json.relatedSymbols) ? json.relatedSymbols : [])
      setContentJson(json.contentJson || { type: 'doc', content: [{ type: 'paragraph' }] })
      setFullContent(json.fullContent || '')
      setSchemaMarkup(Array.isArray(json.schemaMarkup) ? json.schemaMarkup : [])
      setRevisions(Array.isArray(json.revisions) ? json.revisions : [])
    } finally {
      setLoading(false)
    }
  }, [id, isNew])

  const loadOptions = useCallback(async () => {
    const res = await fetch('/api/symbols?limit=500')
    const json = await res.json()
    setAllSymbols(Array.isArray(json.data) ? json.data : [])
  }, [])

  useEffect(() => {
    loadEditorFeatures()
    loadOptions()
    loadSymbol()
  }, [loadEditorFeatures, loadOptions, loadSymbol])

  const payload = useMemo(
    () => ({
      name,
      slug,
      letter,
      shortDefinition,
      status,
      metaTitle,
      metaDescription,
      relatedSymbols: editorFeatures.allowRelatedSymbols ? relatedSymbols : [],
      contentJson,
      fullContent,
      schemaMarkup,
    }),
    [
      name,
      slug,
      letter,
      shortDefinition,
      status,
      metaTitle,
      metaDescription,
      relatedSymbols,
      contentJson,
      fullContent,
      schemaMarkup,
      editorFeatures.allowRelatedSymbols,
    ],
  )

  const save = useCallback(
    async (manual = false) => {
      if (!name) return
      setSaving(true)
      try {
        const res = await fetch(isNew ? '/api/symbols' : `/api/symbols/${id}`, {
          method: isNew ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        if (json?.contentJson) setContentJson(json.contentJson)
        if (typeof json?.fullContent === 'string') setFullContent(json.fullContent)
        if (typeof json?.slug === 'string') setSlug(json.slug)
        if (isNew && json?.id) router.replace(`/admin/symbols/${json.id}`)
        if (manual) setDirty(false)
      } finally {
        setSaving(false)
      }
    },
    [id, isNew, name, payload, router],
  )

  useEffect(() => {
    const interval = setInterval(() => {
      if (dirty && !saving) save(false)
    }, 60000)

    return () => clearInterval(interval)
  }, [dirty, saving, save])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        save(true)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [save])

  if (loading) return <div className="text-slate-300">Se incarca simbolul...</div>

  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-[65%_35%]">
      <div className="space-y-4">
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setDirty(true)
          }}
          placeholder="Nume simbol"
          className="w-full border-b border-slate-700 bg-transparent pb-3 text-3xl font-bold focus:outline-none"
        />

        <div className="grid grid-cols-2 gap-3">
          <input
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value)
              setDirty(true)
            }}
            placeholder="slug"
            className="w-full rounded-lg border border-slate-700 bg-[#1e293b] px-3 py-2"
          />
          <input value={letter} readOnly className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2" />
        </div>

        <textarea
          value={shortDefinition}
          onChange={(e) => {
            setShortDefinition(e.target.value.slice(0, 200))
            setDirty(true)
          }}
          rows={3}
          placeholder="Definitie scurta (max 200)"
          className="w-full rounded-lg border border-slate-700 bg-[#1e293b] px-3 py-2"
        />

        <TiptapEditor
          initialContent={contentJson}
          allowedBlocks={editorFeatures.symbolBlocks}
          pendingLinkInsert={pendingLinkInsert}
          onChange={(value) => {
            setContentJson(value.contentJson)
            setFullContent(value.contentHtml)
            setSchemaMarkup(value.schemaMarkup || [])
            setDirty(true)
          }}
        />
      </div>

      <aside className="space-y-4">
        <div className="space-y-3 rounded-xl border border-slate-700 bg-[#1e293b] p-4">
          <h3 className="font-semibold text-white">Publish</h3>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setDirty(true)
            }}
            className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2"
          >
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
          </select>

          <button onClick={() => save(true)} className="w-full rounded-lg bg-[#8b5cf6] px-4 py-2 text-white hover:bg-[#7c3aed]">
            {saving ? 'Se salveaza...' : 'Salveaza (Ctrl+S)'}
          </button>

          {editorFeatures.allowRevisionHistory && (
            <button onClick={() => setShowHistory(true)} className="w-full rounded-lg border border-slate-700 px-4 py-2 text-slate-200">
              Istoric
            </button>
          )}
        </div>

        {availableSeoTabs.length > 0 && (
          <>
            <div className="flex gap-2 rounded-xl border border-slate-700 bg-[#1e293b] p-2">
              {availableSeoTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveSeoTab(tab)}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm ${activeSeoTab === tab ? 'bg-[#8b5cf6] text-white' : 'bg-[#0f172a] text-slate-300'}`}
                >
                  {TAB_LABELS[tab]}
                </button>
              ))}
            </div>

            {activeSeoTab === 'seo' ? (
              <SeoPanel
                title={name}
                slug={slug}
                metaTitle={metaTitle}
                metaDescription={metaDescription}
                contentHtml={fullContent}
                contentJson={contentJson}
                onMetaTitleChange={(value) => {
                  setMetaTitle(value)
                  setDirty(true)
                }}
                onMetaDescriptionChange={(value) => {
                  setMetaDescription(value)
                  setDirty(true)
                }}
                onSlugChange={(value) => {
                  setSlug(value)
                  setDirty(true)
                }}
                symbolData={{
                  name,
                  letter,
                  shortDefinition,
                  relatedSymbols,
                }}
              />
            ) : activeSeoTab === 'geo' ? (
              <GeoPanel
                name={name}
                postType="SYMBOL"
                shortDefinition={shortDefinition}
                contentHtml={fullContent}
                contentJson={contentJson}
              />
            ) : (
              <InternalLinksPanel
                kind="symbol"
                id={isNew ? undefined : id}
                title={name}
                slug={slug}
                contentHtml={fullContent}
                contentJson={contentJson}
                postType="SYMBOL"
                onInsert={(suggestion) => {
                  setPendingLinkInsert({ key: Date.now(), href: suggestion.href, label: suggestion.anchorText })
                  setDirty(true)
                }}
              />
            )}
          </>
        )}

        {editorFeatures.allowRelatedSymbols && (
          <div className="space-y-3 rounded-xl border border-slate-700 bg-[#1e293b] p-4">
            <h3 className="font-semibold text-white">Related Symbols</h3>
            <select
              multiple
              value={relatedSymbols}
              onChange={(event) => {
                const options = Array.from(event.target.selectedOptions).map((option) => option.value)
                setRelatedSymbols(options)
                setDirty(true)
              }}
              className="min-h-36 w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2"
            >
              {allSymbols
                .filter((item) => item.id !== id)
                .map((item) => (
                  <option key={item.id} value={item.slug}>
                    {item.name}
                  </option>
                ))}
            </select>
          </div>
        )}
      </aside>

      {editorFeatures.allowRevisionHistory && (
        <RevisionDrawer
          open={showHistory}
          revisions={revisions}
          onClose={() => setShowHistory(false)}
          onRestore={(revision) => {
            if (revision.name) setName(revision.name)
            if (revision.shortDefinition) setShortDefinition(revision.shortDefinition)
            if (typeof revision.contentJson !== 'undefined') setContentJson(revision.contentJson)
            if (typeof revision.fullContent !== 'undefined') setFullContent(revision.fullContent || '')
            if (typeof revision.metaTitle !== 'undefined') setMetaTitle(revision.metaTitle || '')
            if (typeof revision.metaDescription !== 'undefined') setMetaDescription(revision.metaDescription || '')
            setDirty(true)
            setShowHistory(false)
          }}
        />
      )}
    </section>
  )
}

