/* eslint-disable @next/next/no-img-element */
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { RevisionDrawer } from '@/components/editor/RevisionDrawer'
import { TiptapEditor } from '@/components/editor/TiptapEditor'
import { GeoPanel } from '@/components/seo/GeoPanel'
import { SeoPanel } from '@/components/seo/SeoPanel'
import { MediaPicker } from '@/components/media/MediaPicker'
import { InternalLinksPanel } from '@/components/seo/InternalLinksPanel'
import { DEFAULT_EDITOR_PANELS, DEFAULT_SITE_EDITOR_FEATURES } from '@/lib/sites/editor-features'
import type { EditorPanelKey, SitePackEditorFeatures } from '@/lib/sites/types'

type Category = { id: string; name: string; slug: string }
type TopicCluster = { id: string; name: string; slug: string }

type Revision = {
  version: number
  savedAt: string
  userId: string
  title?: string
  contentJson?: unknown
  contentHtml?: string
  metaTitle?: string
  metaDescription?: string
}

const TAB_LABELS: Record<EditorPanelKey, string> = {
  seo: 'SEO',
  geo: 'GEO/AEO',
  links: 'Links',
}

export const dynamic = 'force-dynamic'

export default function PostEditorPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params.id
  const isNew = id === 'new'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [activeSeoTab, setActiveSeoTab] = useState<EditorPanelKey>('seo')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editorFeatures, setEditorFeatures] = useState<SitePackEditorFeatures>(DEFAULT_SITE_EDITOR_FEATURES)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [status, setStatus] = useState('DRAFT')
  const [postType, setPostType] = useState('ARTICLE')
  const [pageType, setPageType] = useState<'CONTENT' | 'LANDING' | 'HUB' | 'SUPPORT'>('CONTENT')
  const [templateType, setTemplateType] = useState<'ARTICLE' | 'DREAM' | 'SYMBOL' | 'HUB' | 'GUIDE' | 'LANDING'>('ARTICLE')
  const [verticalType, setVerticalType] = useState<'DREAMS' | 'SYMBOLS' | 'ANGEL_NUMBERS' | 'GENERIC'>('DREAMS')
  const [categoryId, setCategoryId] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [focusKeyword, setFocusKeyword] = useState('')
  const [contentJson, setContentJson] = useState<unknown>({ type: 'doc', content: [{ type: 'paragraph' }] })
  const [contentHtml, setContentHtml] = useState('')
  const [schemaMarkup, setSchemaMarkup] = useState<unknown[]>([])
  const [revisions, setRevisions] = useState<Revision[]>([])
  const [featuredImageId, setFeaturedImageId] = useState<string | null>(null)
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | null>(null)
  const [pendingLinkInsert, setPendingLinkInsert] = useState<{ key: number; href: string; label: string } | null>(null)

  const [categories, setCategories] = useState<Category[]>([])
  const [topicClusters, setTopicClusters] = useState<TopicCluster[]>([])
  const [topicClusterId, setTopicClusterId] = useState('')

  const availableSeoTabs = editorFeatures.postPanels.length ? editorFeatures.postPanels : DEFAULT_EDITOR_PANELS

  useEffect(() => {
    if (availableSeoTabs.length > 0 && !availableSeoTabs.includes(activeSeoTab)) {
      setActiveSeoTab(availableSeoTabs[0])
    }
  }, [activeSeoTab, availableSeoTabs])

  const loadEditorFeatures = useCallback(async () => {
    const res = await fetch('/api/sites/current')
    if (!res.ok) return
    const json = await res.json()
    const nextFeatures = json?.sitePack?.features?.editor
    if (nextFeatures) {
      setEditorFeatures(nextFeatures as SitePackEditorFeatures)
    }
  }, [])

  const loadCategories = useCallback(async () => {
    const res = await fetch('/api/categories?limit=500')
    const json = await res.json()
    setCategories(Array.isArray(json.data) ? json.data : [])
  }, [])

  const loadTopicClusters = useCallback(async () => {
    const res = await fetch('/api/topics')
    const json = await res.json()
    setTopicClusters(Array.isArray(json.clusters) ? json.clusters.map((item: TopicCluster) => ({ id: item.id, name: item.name, slug: item.slug })) : [])
  }, [])

  const loadPost = useCallback(async () => {
    if (isNew) return
    setLoading(true)
    try {
      const res = await fetch(`/api/posts/${id}`)
      if (!res.ok) return
      const post = await res.json()
      setTitle(post.title || '')
      setSlug(post.slug || '')
      setStatus(post.status || 'DRAFT')
      setPostType(post.postType || 'ARTICLE')
      setPageType(post.pageType || 'CONTENT')
      setTemplateType(post.templateType || (post.sourceType === 'HUB' ? 'HUB' : post.postType === 'DREAM_INTERPRETATION' ? 'DREAM' : 'ARTICLE'))
      setVerticalType(post.verticalType || 'DREAMS')
      setCategoryId(post.categoryId || '')
      setMetaTitle(post.metaTitle || '')
      setMetaDescription(post.metaDescription || '')
      setFocusKeyword(post.focusKeyword || '')
      setContentJson(post.contentJson || { type: 'doc', content: [{ type: 'paragraph' }] })
      setContentHtml(post.contentHtml || '')
      setSchemaMarkup(Array.isArray(post.schemaMarkup) ? post.schemaMarkup : [])
      setRevisions(Array.isArray(post.revisions) ? post.revisions : [])
      setFeaturedImageId(post.featuredImageId || null)
      setFeaturedImageUrl(post.featuredImage?.urls?.webp || post.featuredImage?.url || null)
      setTopicClusterId(post.topicClusterId || '')
    } finally {
      setLoading(false)
    }
  }, [id, isNew])

  useEffect(() => {
    loadEditorFeatures()
    loadCategories()
    loadPost()
  }, [loadCategories, loadEditorFeatures, loadPost])

  useEffect(() => {
    if (editorFeatures.allowTopicClusters) {
      loadTopicClusters()
    }
  }, [editorFeatures.allowTopicClusters, loadTopicClusters])

  const payload = useMemo(
    () => ({
      title,
      slug,
      status,
      postType,
      pageType,
      templateType,
      verticalType,
      categoryId: categoryId || null,
      metaTitle,
      metaDescription,
      focusKeyword,
      contentJson,
      contentHtml,
      schemaMarkup,
      featuredImageId,
      topicClusterId: editorFeatures.allowTopicClusters ? topicClusterId || null : null,
    }),
    [
      title,
      slug,
      status,
      postType,
      pageType,
      templateType,
      verticalType,
      categoryId,
      metaTitle,
      metaDescription,
      focusKeyword,
      contentJson,
      contentHtml,
      schemaMarkup,
      featuredImageId,
      topicClusterId,
      editorFeatures.allowTopicClusters,
    ],
  )

  const save = useCallback(
    async (manual = false) => {
      if (!title) return
      setSaving(true)
      try {
        const res = await fetch(isNew ? '/api/posts' : `/api/posts/${id}`, {
          method: isNew ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const json = await res.json()
        if (json?.contentJson) setContentJson(json.contentJson)
        if (typeof json?.contentHtml === 'string') setContentHtml(json.contentHtml)
        if (Array.isArray(json?.schemaMarkup)) setSchemaMarkup(json.schemaMarkup)
        if (typeof json?.slug === 'string') setSlug(json.slug)
        if (json?.featuredImage?.urls?.webp || json?.featuredImage?.url) {
          setFeaturedImageUrl(json.featuredImage.urls?.webp || json.featuredImage.url)
        }
        if (isNew && json?.id) {
          router.replace(`/admin/posts/${json.id}`)
        }
        if (manual) setDirty(false)
      } finally {
        setSaving(false)
      }
    },
    [id, isNew, payload, router, title],
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

  if (loading) return <div className="text-slate-300">Se incarca articolul...</div>

  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-[65%_35%]">
      <div className="space-y-4">
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value)
            setDirty(true)
          }}
          placeholder="Titlu articol"
          className="w-full border-b border-slate-700 bg-transparent pb-3 text-3xl font-bold focus:outline-none"
        />

        <input
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value)
            setDirty(true)
          }}
          placeholder="slug"
          className="w-full rounded-lg border border-slate-700 bg-[#1e293b] px-3 py-2"
        />

        <TiptapEditor
          initialContent={contentJson}
          allowedBlocks={editorFeatures.postBlocks}
          pendingLinkInsert={pendingLinkInsert}
          onChange={(value) => {
            setContentJson(value.contentJson)
            setContentHtml(value.contentHtml)
            setSchemaMarkup(value.schemaMarkup || [])
            setDirty(true)
          }}
        />
      </div>

      <aside className="space-y-4">
        <div className="space-y-3 rounded-xl border border-slate-700 bg-[#1e293b] p-4">
          <h3 className="font-semibold text-white">Publicare</h3>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setDirty(true)
            }}
            className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2"
          >
            <option value="DRAFT">DRAFT</option>
            <option value="REVIEW">REVIEW</option>
            <option value="PUBLISHED">PUBLISHED</option>
            <option value="ARCHIVED">ARCHIVED</option>
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
                title={title}
                slug={slug}
                metaTitle={metaTitle}
                metaDescription={metaDescription}
                contentHtml={contentHtml}
                contentJson={contentJson}
                categories={categories}
                categoryId={categoryId}
                focusKeyword={focusKeyword}
                onFocusKeywordChange={(value) => {
                  setFocusKeyword(value)
                  setDirty(true)
                }}
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
              />
            ) : activeSeoTab === 'geo' ? (
              <GeoPanel
                title={title}
                postType={postType as 'ARTICLE' | 'DREAM_INTERPRETATION' | 'SYMBOL'}
                focusKeyword={focusKeyword}
                contentHtml={contentHtml}
                contentJson={contentJson}
              />
            ) : (
              <InternalLinksPanel
                kind="post"
                id={isNew ? undefined : id}
                title={title}
                slug={slug}
                contentHtml={contentHtml}
                contentJson={contentJson}
                focusKeyword={focusKeyword}
                categoryId={categoryId}
                categorySlug={categories.find((cat) => cat.id === categoryId)?.slug}
                postType={postType}
                onInsert={(suggestion) => {
                  setPendingLinkInsert({ key: Date.now(), href: suggestion.href, label: suggestion.anchorText })
                  setDirty(true)
                }}
              />
            )}
          </>
        )}

        <div className="space-y-3 rounded-xl border border-slate-700 bg-[#1e293b] p-4">
          <h3 className="font-semibold text-white">Categorie & Tip</h3>
          <select
            value={postType}
            onChange={(e) => {
              setPostType(e.target.value)
              setDirty(true)
            }}
            className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2"
          >
            <option value="ARTICLE">ARTICLE</option>
            <option value="DREAM_INTERPRETATION">DREAM_INTERPRETATION</option>
            <option value="SYMBOL">SYMBOL</option>
          </select>

          <select
            value={pageType}
            onChange={(e) => {
              setPageType(e.target.value as 'CONTENT' | 'LANDING' | 'HUB' | 'SUPPORT')
              setDirty(true)
            }}
            className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2"
          >
            <option value="CONTENT">CONTENT</option>
            <option value="LANDING">LANDING</option>
            <option value="HUB">HUB</option>
            <option value="SUPPORT">SUPPORT</option>
          </select>

          <select
            value={templateType}
            onChange={(e) => {
              setTemplateType(e.target.value as 'ARTICLE' | 'DREAM' | 'SYMBOL' | 'HUB' | 'GUIDE' | 'LANDING')
              setDirty(true)
            }}
            className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2"
          >
            <option value="ARTICLE">ARTICLE</option>
            <option value="DREAM">DREAM</option>
            <option value="SYMBOL">SYMBOL</option>
            <option value="HUB">HUB</option>
            <option value="GUIDE">GUIDE</option>
            <option value="LANDING">LANDING</option>
          </select>

          <select
            value={verticalType}
            onChange={(e) => {
              setVerticalType(e.target.value as 'DREAMS' | 'SYMBOLS' | 'ANGEL_NUMBERS' | 'GENERIC')
              setDirty(true)
            }}
            className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2"
          >
            <option value="DREAMS">DREAMS</option>
            <option value="SYMBOLS">SYMBOLS</option>
            <option value="ANGEL_NUMBERS">ANGEL_NUMBERS</option>
            <option value="GENERIC">GENERIC</option>
          </select>

          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value)
              setDirty(true)
            }}
            className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2"
          >
            <option value="">Fara categorie</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {editorFeatures.allowTopicClusters && (
            <select
              value={topicClusterId}
              onChange={(e) => {
                setTopicClusterId(e.target.value)
                setDirty(true)
              }}
              className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2"
            >
              <option value="">Fara topic cluster</option>
              {topicClusters.map((cluster) => (
                <option key={cluster.id} value={cluster.id}>
                  {cluster.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {editorFeatures.allowFeaturedImage && (
          <div className="space-y-3 rounded-xl border border-slate-700 bg-[#1e293b] p-4">
            <h3 className="font-semibold text-white">Featured Image</h3>
            {featuredImageUrl ? (
              <img src={featuredImageUrl} alt="featured" className="h-40 w-full rounded object-cover" />
            ) : (
              <p className="text-sm text-slate-400">Nicio imagine selectata.</p>
            )}
            <div className="flex gap-2">
              <button
                className="flex-1 rounded bg-[#8b5cf6] px-3 py-2 text-white"
                onClick={() => setPickerOpen(true)}
              >
                Alege imagine
              </button>
              {featuredImageId && (
                <button
                  className="rounded bg-slate-800 px-3 py-2 text-slate-200"
                  onClick={() => {
                    setFeaturedImageId(null)
                    setFeaturedImageUrl(null)
                    setDirty(true)
                  }}
                >
                  Sterge
                </button>
              )}
            </div>
          </div>
        )}
      </aside>

      {editorFeatures.allowRevisionHistory && (
        <RevisionDrawer
          open={showHistory}
          revisions={revisions}
          onClose={() => setShowHistory(false)}
          onRestore={(revision) => {
            if (revision.title) setTitle(revision.title)
            if (typeof revision.contentJson !== 'undefined') setContentJson(revision.contentJson)
            if (typeof revision.contentHtml !== 'undefined') setContentHtml(revision.contentHtml)
            if (typeof revision.metaTitle !== 'undefined') setMetaTitle(revision.metaTitle || '')
            if (typeof revision.metaDescription !== 'undefined') setMetaDescription(revision.metaDescription || '')
            setDirty(true)
            setShowHistory(false)
          }}
        />
      )}

      {editorFeatures.allowFeaturedImage && (
        <MediaPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={(item) => {
            setFeaturedImageId(item.id)
            setFeaturedImageUrl(item.urls?.webp || item.url)
            setDirty(true)
            setPickerOpen(false)
          }}
        />
      )}
    </section>
  )
}







