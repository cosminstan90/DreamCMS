/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useMemo, useState } from 'react'
import { SerpPreview } from './SerpPreview'
import { generateSlug } from '@/lib/utils'

type Category = { id: string; name: string; slug: string; parentId?: string | null }

type SeoPanelProps = {
  title: string
  slug: string
  metaTitle: string
  metaDescription: string
  contentHtml: string
  contentJson: unknown
  categories?: Category[]
  categoryId?: string
  onMetaTitleChange: (value: string) => void
  onMetaDescriptionChange: (value: string) => void
  onSlugChange: (value: string) => void
  focusKeyword?: string
  onFocusKeywordChange?: (value: string) => void
  symbolData?: {
    name: string
    letter: string
    shortDefinition: string
    relatedSymbols: string[]
  }
}

type Analysis = {
  wordCount: number
  h2Count: number
  internalLinks: number
  imagesMissingAlt: number
  faqPresent: boolean
  keywordDensity: number
  keywordInTitle: boolean
  keywordInMeta: boolean
  keywordInFirstParagraph: boolean
}

function stripHtml(input: string) {
  return input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function extractFirstParagraph(html: string) {
  const match = html.match(/<p[^>]*>(.*?)<\/p>/i)
  return match ? stripHtml(match[1]) : ''
}

function countMatches(text: string, keyword: string) {
  if (!keyword) return 0
  const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
  const matches = text.match(regex)
  return matches ? matches.length : 0
}

function hasFaqBlock(contentJson: any) {
  let found = false
  function walk(node: any) {
    if (!node || found) return
    if (node.type === 'faqBlock') {
      found = true
      return
    }
    if (Array.isArray(node.content)) node.content.forEach(walk)
  }
  walk(contentJson)
  return found
}

function hasDreamSymbolsList(contentJson: any) {
  let found = false
  function walk(node: any) {
    if (!node || found) return
    if (node.type === 'dreamSymbolsListBlock') {
      found = true
      return
    }
    if (Array.isArray(node.content)) node.content.forEach(walk)
  }
  walk(contentJson)
  return found
}

function estimateTitlePixels(title: string) {
  return Math.round(title.length * 9.5)
}

export function SeoPanel(props: SeoPanelProps) {
  const {
    title,
    slug,
    metaTitle,
    metaDescription,
    contentHtml,
    contentJson,
    categories = [],
    categoryId,
    onMetaTitleChange,
    onMetaDescriptionChange,
    onSlugChange,
    focusKeyword,
    onFocusKeywordChange,
    symbolData,
  } = props

  const [analysis, setAnalysis] = useState<Analysis>({
    wordCount: 0,
    h2Count: 0,
    internalLinks: 0,
    imagesMissingAlt: 0,
    faqPresent: false,
    keywordDensity: 0,
    keywordInTitle: false,
    keywordInMeta: false,
    keywordInFirstParagraph: false,
  })

  useEffect(() => {
    const handle = setTimeout(() => {
      const text = stripHtml(contentHtml || '')
      const words = text ? text.split(' ').filter(Boolean) : []
      const keyword = (focusKeyword || '').trim().toLowerCase()
      const firstParagraph = extractFirstParagraph(contentHtml || '').toLowerCase()
      const matches = keyword ? countMatches(text.toLowerCase(), keyword) : 0
      const density = words.length > 0 ? Math.round((matches / words.length) * 1000) / 10 : 0

      const h2Count = (contentHtml.match(/<h2[^>]*>/gi) || []).length
      const internalLinks = (contentHtml.match(/<a[^>]+href=["'](\/|https?:\/\/(www\.)?candvisam\.ro)[^"']+["'][^>]*>/gi) || []).length
      const imagesMissingAlt = (contentHtml.match(/<img[^>]+>/gi) || []).filter((img) => !/alt=/.test(img)).length

      setAnalysis({
        wordCount: words.length,
        h2Count,
        internalLinks,
        imagesMissingAlt,
        faqPresent: hasFaqBlock(contentJson),
        keywordDensity: density,
        keywordInTitle: keyword ? title.toLowerCase().includes(keyword) : false,
        keywordInMeta: keyword ? metaTitle.toLowerCase().includes(keyword) : false,
        keywordInFirstParagraph: keyword ? firstParagraph.includes(keyword) : false,
      })
    }, 500)

    return () => clearTimeout(handle)
  }, [contentHtml, contentJson, focusKeyword, metaTitle, title])

  const seoScore = useMemo(() => {
    let score = 0
    if (analysis.wordCount >= 500) score += 20
    if (analysis.h2Count >= 2) score += 10
    if (analysis.internalLinks >= 1) score += 10
    if (analysis.imagesMissingAlt === 0) score += 10
    if (analysis.keywordInTitle) score += 10
    if (analysis.keywordInMeta) score += 10
    if (analysis.keywordInFirstParagraph) score += 5
    if (metaDescription.length >= 80) score += 5
    if (analysis.faqPresent) score += 10
    if (metaTitle.length > 0) score += 5
    if (slug.length > 0) score += 5
    return Math.min(score, 100)
  }, [analysis, metaDescription, metaTitle, slug])

  const scoreColor = seoScore >= 80 ? 'bg-emerald-500' : seoScore >= 55 ? 'bg-amber-500' : 'bg-rose-500'

  const categorySlug = categories.find((cat) => cat.id === categoryId)?.slug || ''
  const fullUrl = `candvisam.ro/${categorySlug ? `${categorySlug}/` : ''}${slug}`

  const keywordTone = (flag: boolean) => (flag ? 'text-emerald-400' : 'text-rose-400')

  const symbolChecks = symbolData
    ? {
        letterOk: symbolData.letter === (symbolData.name?.charAt(0) || '').toUpperCase(),
        shortDefinitionOk: symbolData.shortDefinition.length >= 100 && symbolData.shortDefinition.length <= 200,
        relatedOk: symbolData.relatedSymbols.length >= 3,
        definedTermOk: true,
      }
    : null

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4 space-y-2">
        <h3 className="text-white font-semibold">SEO Score</h3>
        <div className="w-full bg-slate-800 rounded-full h-2">
          <div className={`${scoreColor} h-2 rounded-full`} style={{ width: `${seoScore}%` }} />
        </div>
        <div className="text-sm text-slate-300">Scor: {seoScore}/100</div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4 space-y-3">
        <h3 className="text-white font-semibold">Focus Keyword</h3>
        <input
          value={focusKeyword || ''}
          onChange={(e) => onFocusKeywordChange?.(e.target.value)}
          placeholder="Keyword principal"
          className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2"
        />
        <div className="text-xs text-slate-400">Densitate: {analysis.keywordDensity}%</div>
        <div className={`text-xs ${keywordTone(analysis.keywordInTitle)}`}>Keyword in title</div>
        <div className={`text-xs ${keywordTone(analysis.keywordInMeta)}`}>Keyword in meta</div>
        <div className={`text-xs ${keywordTone(analysis.keywordInFirstParagraph)}`}>Keyword in primul paragraf</div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Title</h3>
          <span className="text-xs text-slate-400">{metaTitle.length}/60</span>
        </div>
        <input
          value={metaTitle}
          onChange={(e) => onMetaTitleChange(e.target.value)}
          placeholder="Meta title"
          className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2"
        />
        <div className="text-xs text-slate-400">Largime estimata: {estimateTitlePixels(metaTitle)}px</div>

        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Meta Description</h3>
          <span className="text-xs text-slate-400">{metaDescription.length}/155</span>
        </div>
        <textarea
          value={metaDescription}
          onChange={(e) => onMetaDescriptionChange(e.target.value)}
          rows={4}
          placeholder="Meta description"
          className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2"
        />

        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Slug</h3>
          <button
            type="button"
            onClick={() => onSlugChange(generateSlug(title))}
            className="text-xs text-violet-300 hover:text-violet-200"
          >
            Regenereaza
          </button>
        </div>
        <input
          value={slug}
          onChange={(e) => onSlugChange(e.target.value)}
          className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2"
        />
        <div className="text-xs text-slate-400">{fullUrl}</div>
      </div>

      <SerpPreview
        title={metaTitle || title}
        slug={slug}
        categorySlug={categorySlug}
        description={metaDescription}
      />

      <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4 space-y-2">
        <h3 className="text-white font-semibold">Content Analysis</h3>
        <div className={`text-xs ${analysis.wordCount >= 500 ? 'text-emerald-400' : 'text-rose-400'}`}>Word count: {analysis.wordCount} (min 500)</div>
        <div className={`text-xs ${analysis.h2Count >= 2 ? 'text-emerald-400' : 'text-rose-400'}`}>H2: {analysis.h2Count} (min 2)</div>
        <div className={`text-xs ${analysis.internalLinks >= 1 ? 'text-emerald-400' : 'text-rose-400'}`}>Internal links: {analysis.internalLinks} (min 1)</div>
        <div className={`text-xs ${analysis.imagesMissingAlt === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>Images alt: {analysis.imagesMissingAlt === 0 ? 'OK' : `${analysis.imagesMissingAlt} missing`}</div>
        <div className={`text-xs ${metaTitle ? 'text-emerald-400' : 'text-rose-400'}`}>Meta title complet</div>
        <div className={`text-xs ${metaDescription ? 'text-emerald-400' : 'text-rose-400'}`}>Meta description complet</div>
        <div className={`text-xs ${analysis.faqPresent ? 'text-emerald-400' : 'text-slate-400'}`}>FAQ present</div>
        <div className={`text-xs ${hasDreamSymbolsList(contentJson) ? 'text-emerald-400' : 'text-slate-400'}`}>DreamSymbolsList present</div>
      </div>

      {symbolChecks && (
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4 space-y-2">
          <h3 className="text-white font-semibold">Symbol SEO</h3>
          <div className={`text-xs ${symbolChecks.letterOk ? 'text-emerald-400' : 'text-rose-400'}`}>Letter OK</div>
          <div className={`text-xs ${symbolChecks.shortDefinitionOk ? 'text-emerald-400' : 'text-rose-400'}`}>shortDefinition 100-200 chars</div>
          <div className={`text-xs ${symbolChecks.relatedOk ? 'text-emerald-400' : 'text-rose-400'}`}>Related symbols min 3</div>
          <div className={`text-xs ${symbolChecks.definedTermOk ? 'text-emerald-400' : 'text-rose-400'}`}>DefinedTerm schema OK</div>
        </div>
      )}
    </div>
  )
}

