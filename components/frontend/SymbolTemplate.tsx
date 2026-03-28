import Link from 'next/link'
import { AdSlot } from '@/components/ads/AdSlot'
import { AdsConfig, defaultAdsConfig } from '@/lib/ads/config'
import { RecommendedProducts } from '@/components/affiliate/RecommendedProducts'
import { NewsletterCta } from '@/components/frontend/NewsletterCta'
import { MonetizationDisclosure } from '@/components/frontend/MonetizationDisclosure'
import { prepareHtmlForRendering } from '@/lib/frontend/content'
import { getAllowedDataNodesForSitePack } from '@/lib/sites/blocks'

type AffiliateProductItem = {
  id: string
  title: string
  slug: string
  affiliateUrl: string
  image?: string | null
  priceText?: string | null
  badge?: string | null
  merchant?: string | null
  network?: string | null
  category?: string | null
}

type SymbolTemplateProps = {
  name: string
  slug: string
  letter: string
  shortDefinition: string
  fullContent: string
  directAnswer?: string | null
  llmSummary?: string | null
  speakableSections?: string[]
  emoji?: string
  relatedSymbols: Array<{ slug: string; name: string; letter?: string }>
  prevSymbol?: { slug: string; name: string } | null
  nextSymbol?: { slug: string; name: string } | null
  adsConfig?: AdsConfig
  pagePath: string
  affiliateProducts?: AffiliateProductItem[]
  sitePackKey?: string
}

export function SymbolTemplate(props: SymbolTemplateProps) {
  const {
    name,
    letter,
    shortDefinition,
    fullContent,
    directAnswer,
    llmSummary,
    speakableSections = [],
    emoji,
    relatedSymbols,
    prevSymbol,
    nextSymbol,
    adsConfig = defaultAdsConfig,
    pagePath,
    affiliateProducts = [],
    sitePackKey,
  } = props

  const safeHtml = prepareHtmlForRendering(fullContent || '', {
    allowedDataNodes: getAllowedDataNodesForSitePack(sitePackKey, 'symbol'),
  })
  const dreamy = sitePackKey !== 'numarangelic'

  if (!dreamy) {
    return (
      <main className="min-h-screen bg-[#fefdf8] text-[#2c2240]">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <nav className="mb-6 text-sm text-[#6f5a92]">
            <Link href="/dictionar" className="hover:text-[#47306f]">Dictionar</Link> / <Link href={`/dictionar/${letter}`} className="hover:text-[#47306f]">{letter}</Link> / {name}
          </nav>
          <header className="rounded-3xl border border-[#e3d8f8] bg-white p-8">
            <div className="mb-2 text-4xl">{emoji || 'Simbol'}</div>
            <h1 className="text-4xl font-semibold text-[#2f2050]">{name}</h1>
            <p className="mt-4 rounded-xl border border-[#ddd1f7] bg-[#f1ecff] p-4 text-[#4e3b74]">{shortDefinition}</p>
          </header>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f7f0ff_0%,_#fefdf8_38%,_#fcf8f2_100%)] text-[#2c2240]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <nav className="mb-8 text-xs uppercase tracking-[0.18em] text-[#8a74aa]">
          <Link href="/dictionar" className="hover:text-[#47306f]">Dictionar</Link> / <Link href={`/dictionar/${letter}`} className="hover:text-[#47306f]">{letter}</Link> / {name}
        </nav>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(280px,0.4fr)]">
          <div className="rounded-[2.4rem] border border-[#e5d8f7] bg-white/80 p-8 shadow-[0_28px_90px_rgba(88,59,136,0.1)] backdrop-blur md:p-10">
            <div className="mb-4 text-5xl text-[#7b67a5]">{emoji || '?'}</div>
            <h1 className="font-serif text-4xl text-[#2f2050] md:text-6xl">{name}</h1>
            <p className="mt-5 rounded-[1.6rem] border border-[#ddd1f7] bg-[#f6f1ff] p-5 text-base leading-8 text-[#4e3b74]">{shortDefinition}</p>
            {(directAnswer || llmSummary) && (
              <div className="mt-6 rounded-[1.7rem] border border-[#dfd2f7] bg-white p-5">
                {directAnswer && <p className="font-medium leading-8 text-[#2f2050]">{directAnswer}</p>}
                {llmSummary && <p className="mt-3 text-sm leading-7 text-[#5f4b80]">{llmSummary}</p>}
              </div>
            )}
          </div>

          <aside className="space-y-6 lg:pt-3">
            {speakableSections.length > 0 && (
              <div className="rounded-[1.8rem] border border-[#e7def5] bg-white/80 p-5 backdrop-blur">
                <div className="mb-3 text-xs uppercase tracking-[0.22em] text-[#8a74aa]">Repere</div>
                <div className="flex flex-wrap gap-2">
                  {speakableSections.slice(0, 6).map((section) => (
                    <span key={section} className="rounded-full border border-[#ddd1f7] bg-white px-3 py-1 text-xs text-[#5f4b80]">
                      {section}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="rounded-[1.8rem] border border-[#e7def5] bg-[linear-gradient(180deg,#fffdfa,#faf5ff)] p-5">
              <div className="mb-3 text-[11px] uppercase tracking-[0.22em] text-[#8a74aa]">pasul urmator</div>
              <div className="space-y-3 text-sm leading-7 text-[#5f4b80]">
                <div>1. Citeste definitia rapida de mai sus.</div>
                <div>2. Continua cu simbolurile inrudite din aceeasi stare.</div>
                <div>3. Revino pentru alte litere sau aboneaza-te la update-uri.</div>
              </div>
            </div>
            <AdSlot config={adsConfig} route="symbolPage" slotKey="inContent1" pagePath={pagePath} />
          </aside>
        </section>

        <article className="prose prose-lg mt-10 max-w-none prose-headings:font-serif prose-headings:text-[#2f2050] prose-p:leading-8 prose-a:text-[#4f35a1]" dangerouslySetInnerHTML={{ __html: safeHtml }} />

        <div className="mt-10">
          <RecommendedProducts products={affiliateProducts} pagePath={pagePath} templateType="symbol" title="Resurse recomandate dupa acest simbol" />
        </div>

        <div className="mt-8">
          <MonetizationDisclosure hasAffiliate={affiliateProducts.length > 0} hasAds={adsConfig.enabled && adsConfig.routes.symbolPage} />
        </div>

        <div className="mt-10">
          <NewsletterCta sourcePath={pagePath} variantStyle={dreamy ? 'dreamy' : 'angelic'} title="Primeste simboluri noi pe email" subtitle="Aboneaza-te pentru interpretari concise si simboluri explicate pe inteles." />
        </div>

        <div className="mt-8">
          <AdSlot config={adsConfig} route="symbolPage" slotKey="inContent2" pagePath={pagePath} label="Descoperiri sponsorizate" />
        </div>

        {relatedSymbols.length > 0 && (
          <section className="mt-14">
            <div className="mb-4 text-xs uppercase tracking-[0.22em] text-[#8a74aa]">Simboluri inrudite</div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              {relatedSymbols.map((item) => (
                <Link key={item.slug} href={`/dictionar/${item.letter || item.slug.charAt(0).toUpperCase()}/${item.slug}`} className="border-t border-[#e6daf7] pt-4 transition-colors hover:border-[#c8b3ec]">
                  <div className="font-semibold text-[#34255b]">{item.name}</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-10 flex justify-between text-[#4f35a1]">
          <div>{prevSymbol ? <Link href={`/dictionar/${letter}/${prevSymbol.slug}`}>Anterior: {prevSymbol.name}</Link> : <span />}</div>
          <div>{nextSymbol ? <Link href={`/dictionar/${letter}/${nextSymbol.slug}`}>Urmator: {nextSymbol.name}</Link> : <span />}</div>
        </div>

        <div className="mt-8">
          <AdSlot config={adsConfig} route="symbolPage" slotKey="footer" pagePath={pagePath} />
        </div>
      </div>
    </main>
  )
}
