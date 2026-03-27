'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AdSlot } from '@/components/ads/AdSlot'
import { AdsConfig, defaultAdsConfig } from '@/lib/ads/config'
import { NewsletterCta } from '@/components/frontend/NewsletterCta'

type SymbolItem = { id?: string; name: string; slug: string; letter: string; shortDefinition: string }

type DictionaryTemplateProps = {
  letterCounts: Record<string, number>
  featuredSymbols: SymbolItem[]
  adsConfig?: AdsConfig
  pagePath: string
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export function DictionaryTemplate({ letterCounts, featuredSymbols, adsConfig = defaultAdsConfig, pagePath }: DictionaryTemplateProps) {
  const [search, setSearch] = useState('')
  const [remoteResults, setRemoteResults] = useState<SymbolItem[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const q = search.trim()
    if (q.length < 2) {
      setRemoteResults([])
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        void fetch('/api/analytics/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'SEARCH_USAGE',
            route: pagePath,
            templateType: 'dictionary',
            meta: { query: q },
          }),
          keepalive: true,
        })

        const res = await fetch(`/api/symbols/search?q=${encodeURIComponent(q)}&limit=60`)
        const json = await res.json()
        setRemoteResults(Array.isArray(json.data) ? json.data : [])
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [search, pagePath])

  const filteredFeatured = useMemo(() => {
    if (!search.trim()) return featuredSymbols
    const q = search.toLowerCase()
    return featuredSymbols.filter((item) => item.name.toLowerCase().includes(q) || item.shortDefinition.toLowerCase().includes(q))
  }, [search, featuredSymbols])

  const list = search.trim().length >= 2 ? remoteResults : filteredFeatured

  return (
    <main className="min-h-screen bg-[#fefdf8] text-[#2c2240]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="mb-4 text-4xl font-semibold text-[#2f2050]">Dictionar de Simboluri Onirice</h1>
        <p className="mb-8 max-w-3xl text-[#5f4b80]">Exploreaza simbolurile din vise, ordonate alfabetic, cu interpretari detaliate si conexiuni semnificative pentru contextul tau oniric.</p>

        <div className="mb-8"><AdSlot config={adsConfig} route="dictionaryIndex" slotKey="header" pagePath={pagePath} /></div>

        <div className="mb-10 grid grid-cols-4 gap-3 md:grid-cols-7 lg:grid-cols-9">
          {LETTERS.map((letter) => {
            const count = letterCounts[letter] || 0
            return (
              <Link
                key={letter}
                href={`/dictionar/${letter}`}
                className="rounded-xl border border-[#e2d7fa] bg-white px-3 py-4 text-center transition-colors hover:border-[#bfa7ea]"
              >
                <div className="text-xl font-semibold text-[#39285f]">{letter}</div>
                <div className="text-xs text-[#7a67a4]">{count}</div>
              </Link>
            )
          })}
        </div>

        <div className="mb-6">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cauta simbol in dictionar"
            className="w-full rounded-xl border border-[#e2d7fa] bg-white px-4 py-3 md:w-[460px]"
          />
          {searching && <div className="mt-2 text-sm text-[#7a67a4]">Cautam...</div>}
        </div>

        <div className="mb-8"><AdSlot config={adsConfig} route="dictionaryIndex" slotKey="inContent1" pagePath={pagePath} /></div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {list.map((symbol) => (
            <Link key={`${symbol.letter}-${symbol.slug}`} href={`/dictionar/${symbol.letter}/${symbol.slug}`} className="rounded-2xl border border-[#e2d7fa] bg-white p-4 hover:border-[#bea8e8]">
              <div className="mb-1 text-xs text-[#7a67a4]">Litera {symbol.letter}</div>
              <div className="font-semibold text-[#39285f]">{symbol.name}</div>
              <div className="mt-2 text-sm text-[#5f4b80]">{symbol.shortDefinition}</div>
            </Link>
          ))}
        </div>

        <NewsletterCta sourcePath={pagePath} title="Primeste simboluri noi din dictionar" subtitle="Saptamanal: simboluri noi, contexte si interpretari practice." />

        <div className="mt-8"><AdSlot config={adsConfig} route="dictionaryIndex" slotKey="footer" pagePath={pagePath} /></div>
      </div>
    </main>
  )
}



