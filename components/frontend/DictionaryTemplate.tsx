'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { AdSlot } from '@/components/ads/AdSlot'
import { AdsConfig, defaultAdsConfig } from '@/lib/ads/config'
import { NewsletterCta } from '@/components/frontend/NewsletterCta'
import type { FrontendDictionaryVariant } from '@/lib/sites/frontend-registry'

type SymbolItem = { id?: string; name: string; slug: string; letter: string; shortDefinition: string }

type DictionaryTemplateProps = {
  letterCounts: Record<string, number>
  featuredSymbols: SymbolItem[]
  adsConfig?: AdsConfig
  pagePath: string
  variant?: FrontendDictionaryVariant
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export function DictionaryTemplate({ letterCounts, featuredSymbols, adsConfig = defaultAdsConfig, pagePath, variant = 'dreamy' }: DictionaryTemplateProps) {
  const [search, setSearch] = useState('')
  const [remoteResults, setRemoteResults] = useState<SymbolItem[]>([])
  const [searching, setSearching] = useState(false)
  const dreamy = variant === 'dreamy'

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
  const populatedLetters = LETTERS.filter((letter) => (letterCounts[letter] || 0) > 0)
  const topLetters = [...LETTERS]
    .sort((a, b) => (letterCounts[b] || 0) - (letterCounts[a] || 0))
    .filter((letter) => (letterCounts[letter] || 0) > 0)
    .slice(0, 5)

  if (!dreamy) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff2d8_0%,_#fff8ef_40%,_#fffdf9_100%)] text-[#4c2d12]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="mb-8 rounded-[2rem] border border-[#f2d7ab] bg-[linear-gradient(135deg,#fff9ee,#fff0d7)] p-8">
            <div className="mb-3 inline-flex rounded-full border border-[#f0d3a7] bg-white px-4 py-2 text-xs uppercase tracking-[0.2em] text-[#b96b12]">Indice spiritual A-Z</div>
            <h1 className="mb-4 text-4xl font-semibold text-[#4c2d12]">Dictionar de Semnificatii si Mesaje</h1>
            <p className="max-w-3xl text-[#7c4810]">Exploreaza semnificatii, secvente si simboluri spirituale ordonate alfabetic, cu explicatii clare si usor de parcurs.</p>
          </div>

          <div className="mb-8"><AdSlot config={adsConfig} route="dictionaryIndex" slotKey="header" pagePath={pagePath} /></div>

          <div className="mb-10 grid grid-cols-4 gap-3 md:grid-cols-7 lg:grid-cols-9">
            {LETTERS.map((letter) => {
              const count = letterCounts[letter] || 0
              return (
                <Link
                  key={letter}
                  href={`/dictionar/${letter}`}
                  className="rounded-xl border border-[#f2d8ab] bg-white/95 px-3 py-4 text-center transition-colors hover:border-[#f59e0b]"
                >
                  <div className="text-xl font-semibold text-[#8a4b10]">{letter}</div>
                  <div className="text-xs text-[#b96b12]">{count}</div>
                </Link>
              )
            })}
          </div>

          <div className="mb-6">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cauta mesaj, simbol sau secventa"
              className="w-full rounded-xl border border-[#f2d8ab] bg-white px-4 py-3 md:w-[460px]"
            />
            {searching && <div className="mt-2 text-sm text-[#b96b12]">Cautam...</div>}
          </div>

          <div className="mb-8"><AdSlot config={adsConfig} route="dictionaryIndex" slotKey="inContent1" pagePath={pagePath} /></div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {list.map((symbol) => (
              <Link
                key={`${symbol.letter}-${symbol.slug}`}
                href={`/dictionar/${symbol.letter}/${symbol.slug}`}
                className="rounded-2xl border border-[#f2d8ab] bg-white/95 p-4 hover:border-[#f59e0b]"
              >
                <div className="mb-1 text-xs text-[#b96b12]">Litera {symbol.letter}</div>
                <div className="font-semibold text-[#5b3411]">{symbol.name}</div>
                <div className="mt-2 text-sm text-[#7c4810]">{symbol.shortDefinition}</div>
              </Link>
            ))}
          </div>

          <NewsletterCta sourcePath={pagePath} variantStyle="angelic" title="Primeste simboluri noi din dictionar" subtitle="Saptamanal: simboluri noi, contexte si interpretari practice." />

          <div className="mt-8"><AdSlot config={adsConfig} route="dictionaryIndex" slotKey="footer" pagePath={pagePath} /></div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#f6efff_0%,_#fefdf8_34%,_#fcf8f2_100%)] text-[#2c2240]">
      <section className="relative isolate overflow-hidden border-b border-[#ece3f9]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(123,88,180,0.16),_transparent_33%),radial-gradient(circle_at_82%_18%,_rgba(255,234,244,0.92),_transparent_24%),linear-gradient(180deg,#f7f1ff_0%,#fefcf9_68%,#fefdf8_100%)]" />
        <div className="relative mx-auto max-w-6xl px-6 py-14 md:py-20">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.62fr)] lg:items-end">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-[#ddd0f3] bg-white/80 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[#7b67a5] backdrop-blur">
                indice a-z oniric
              </div>
              <h1 className="max-w-3xl font-serif text-5xl leading-[0.95] text-[#2f2050] md:text-7xl">Dictionarul pentru simbolurile care raman cu tine dupa trezire.</h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[#5f4b80] md:text-lg">
                Exploreaza semnele recurente din vise intr-un index gandit pentru scanare rapida, lectura calmata si reveniri naturale la simbolurile care cer mai mult context.
              </p>
            </div>

            <aside className="rounded-[2rem] border border-[#e5d9f7] bg-white/76 p-6 shadow-[0_24px_70px_rgba(88,59,136,0.08)] backdrop-blur">
              <div className="text-xs uppercase tracking-[0.24em] text-[#8a74aa]">Repere rapide</div>
              <div className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                <div>
                  <div className="text-3xl font-semibold text-[#2f2050]">{populatedLetters.length}</div>
                  <div className="text-sm text-[#6a5a93]">litere populate</div>
                </div>
                <div>
                  <div className="text-3xl font-semibold text-[#2f2050]">{featuredSymbols.length}</div>
                  <div className="text-sm text-[#6a5a93]">simboluri recente</div>
                </div>
                <div>
                  <div className="text-3xl font-semibold text-[#2f2050]">A-Z</div>
                  <div className="text-sm text-[#6a5a93]">intrare rapida in dictionar</div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <AdSlot config={adsConfig} route="dictionaryIndex" slotKey="header" pagePath={pagePath} />
      </div>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 pb-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.55fr)]">
        <div>
          <div className="mb-5 text-xs uppercase tracking-[0.25em] text-[#8f78ab]">Cum folosesti dictionarul</div>
          <h2 className="max-w-2xl font-serif text-3xl leading-tight text-[#2d2148] md:text-5xl">Cauta simbolul, intra pe litera lui si apoi aprofundeaza contextul visului.</h2>
        </div>
        <div className="border-l border-[#e8dcf9] pl-0 text-sm leading-7 text-[#5f4b80] lg:pl-8">
          Structura este facuta pentru cautare organica si sesiuni lungi: intai raspunsul rapid, apoi paginile de simbol, apoi explorarea fireasca spre alte semnificatii inrudite.
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-14">
        <div className="grid gap-8 rounded-[2.4rem] border border-[#e6daf7] bg-white/76 p-6 shadow-[0_24px_70px_rgba(88,59,136,0.06)] backdrop-blur lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.42fr)] lg:p-8">
          <div>
            <div className="mb-4 text-xs uppercase tracking-[0.24em] text-[#8a74aa]">Navigare alfabetica</div>
            <div className="grid grid-cols-4 gap-3 md:grid-cols-7 lg:grid-cols-9">
              {LETTERS.map((letter) => {
                const count = letterCounts[letter] || 0
                return (
                  <Link
                    key={letter}
                    href={`/dictionar/${letter}`}
                    className="rounded-2xl border border-[#e2d7fa] bg-white px-3 py-4 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-[#bfa7ea]"
                  >
                    <div className="text-xl font-semibold text-[#39285f]">{letter}</div>
                    <div className="mt-1 text-xs text-[#7a67a4]">{count}</div>
                  </Link>
                )
              })}
            </div>
          </div>

          <aside className="rounded-[1.8rem] border border-[#e7def5] bg-[linear-gradient(180deg,#fffdf8,#faf5ff)] p-5">
            <div className="mb-3 text-xs uppercase tracking-[0.22em] text-[#8a74aa]">Litere populare</div>
            <div className="space-y-3">
              {topLetters.map((letter) => (
                <Link key={letter} href={`/dictionar/${letter}`} className="flex items-center justify-between border-t border-[#e7def5] py-3 first:border-t-0 first:pt-0">
                  <span className="text-sm font-medium text-[#34255b]">Litera {letter}</span>
                  <span className="text-sm text-[#7a67a4]">{letterCounts[letter]} simboluri</span>
                </Link>
              ))}
              {topLetters.length === 0 && <div className="text-sm text-[#7a67a4]">Simbolurile vor aparea aici pe masura ce populam dictionarul.</div>}
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.45fr)] lg:items-start">
          <div>
            <div className="mb-4 text-xs uppercase tracking-[0.24em] text-[#8a74aa]">Cauta direct</div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cauta simbol in dictionar"
              className="w-full rounded-[1.7rem] border border-[#e2d7fa] bg-white/90 px-5 py-4 text-[#2f2050] outline-none ring-[#8b5cf6] transition focus:ring-2"
            />
            {searching && <div className="mt-3 text-sm text-[#7a67a4]">Cautam simbolurile potrivite...</div>}
          </div>

          <div className="rounded-[1.8rem] border border-[#e7def5] bg-white/80 p-5 backdrop-blur">
            <div className="mb-3 text-xs uppercase tracking-[0.22em] text-[#8a74aa]">Ritm de explorare</div>
            <div className="space-y-3 text-sm leading-7 text-[#5f4b80]">
              <div>1. Introdu simbolul sau incepe de la litera lui.</div>
              <div>2. Citeste definitia scurta pentru raspunsul imediat.</div>
              <div>3. Continua in paginile inrudite pentru context mai profund.</div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 pb-8"><AdSlot config={adsConfig} route="dictionaryIndex" slotKey="inContent1" pagePath={pagePath} /></div>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <div className="mb-3 text-xs uppercase tracking-[0.24em] text-[#8a74aa]">Simboluri recente</div>
            <h2 className="font-serif text-3xl text-[#2d2148] md:text-5xl">Intrari noi, bune pentru sesiuni lungi si cautari recurente.</h2>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {list.map((symbol) => (
            <Link
              key={`${symbol.letter}-${symbol.slug}`}
              href={`/dictionar/${symbol.letter}/${symbol.slug}`}
              className="group border-t border-[#e6daf7] py-5 transition-colors hover:border-[#c8b3ec]"
            >
              <div className="text-xs uppercase tracking-[0.22em] text-[#9079ad]">Litera {symbol.letter}</div>
              <div className="mt-2 text-2xl font-semibold text-[#34255b] transition-colors duration-300 group-hover:text-[#24183d]">{symbol.name}</div>
              <div className="mt-3 text-sm leading-7 text-[#5f4b80]">{symbol.shortDefinition}</div>
            </Link>
          ))}
          {list.length === 0 && (
            <div className="rounded-[1.8rem] border border-dashed border-[#d9cbf0] bg-white/60 p-6 text-sm text-[#6f5a92]">
              Nu am gasit rezultate pentru cautarea ta. Incearca un termen mai scurt sau intra pe litera simbolului.
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-18">
        <NewsletterCta sourcePath={pagePath} variantStyle="dreamy" title="Primeste simboluri noi din dictionar" subtitle="Saptamanal: simboluri noi, contexte si interpretari practice, in acelasi ritm calm si clar." />
      </section>

      <div className="mx-auto max-w-6xl px-6 pb-14"><AdSlot config={adsConfig} route="dictionaryIndex" slotKey="footer" pagePath={pagePath} /></div>
    </main>
  )
}
