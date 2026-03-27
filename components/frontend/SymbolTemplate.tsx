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
  const { name, letter, shortDefinition, fullContent, directAnswer, llmSummary, speakableSections = [], emoji, relatedSymbols, prevSymbol, nextSymbol, adsConfig = defaultAdsConfig, pagePath, affiliateProducts = [], sitePackKey } = props
  const safeHtml = prepareHtmlForRendering(fullContent || '', {
    allowedDataNodes: getAllowedDataNodesForSitePack(sitePackKey, 'symbol'),
  })

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
          {(directAnswer || llmSummary) && (
            <div className="mt-4 rounded-xl border border-[#d8c9f5] bg-[#fcfbff] p-4">
              {directAnswer && <p className="font-medium text-[#2f2050]">{directAnswer}</p>}
              {llmSummary && <p className="mt-2 text-sm text-[#5f4b80]">{llmSummary}</p>}
            </div>
          )}
          {speakableSections.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {speakableSections.slice(0, 6).map((section) => (
                <span key={section} className="rounded-full border border-[#ddd1f7] bg-white px-3 py-1 text-xs text-[#5f4b80]">
                  {section}
                </span>
              ))}
            </div>
          )}
        </header>

        <div className="mt-6">
          <AdSlot config={adsConfig} route="symbolPage" slotKey="inContent1" pagePath={pagePath} />
        </div>

        <article className="prose prose-lg mt-8 max-w-none prose-headings:text-[#2f2050] prose-a:text-[#4f35a1]" dangerouslySetInnerHTML={{ __html: safeHtml }} />

        <RecommendedProducts products={affiliateProducts} pagePath={pagePath} templateType="symbol" title="Produse recomandate" />

        <MonetizationDisclosure hasAffiliate={affiliateProducts.length > 0} hasAds={adsConfig.enabled && adsConfig.routes.symbolPage} />

        <NewsletterCta sourcePath={pagePath} title="Primeste simboluri noi pe email" subtitle="Aboneaza-te pentru interpretari concise si simboluri explicate pe inteles." />

        <div className="mt-8">
          <AdSlot config={adsConfig} route="symbolPage" slotKey="inContent2" pagePath={pagePath} />
        </div>

        {relatedSymbols.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-2xl font-semibold text-[#2f2050]">Simboluri inrudite</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {relatedSymbols.map((item) => (
                <Link key={item.slug} href={`/dictionar/${item.letter || item.slug.charAt(0).toUpperCase()}/${item.slug}`} className="rounded-xl border border-[#e3d8f8] bg-white p-4 hover:border-[#c8b3ec]">
                  <div className="font-semibold text-[#34255b]">{item.name}</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-8">
          <AdSlot config={adsConfig} route="symbolPage" slotKey="footer" pagePath={pagePath} />
        </div>

        <div className="mt-10 flex justify-between text-[#4f35a1]">
          <div>{prevSymbol ? <Link href={`/dictionar/${letter}/${prevSymbol.slug}`}>Anterior: {prevSymbol.name}</Link> : <span />}</div>
          <div>{nextSymbol ? <Link href={`/dictionar/${letter}/${nextSymbol.slug}`}>Urmator: {nextSymbol.name}</Link> : <span />}</div>
        </div>
      </div>
    </main>
  )
}


