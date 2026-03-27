/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { buildMetadata } from '@/lib/frontend/metadata'
import { generateSchema } from '@/lib/seo/schema-generator'
import { calculateGeoScore } from '@/lib/seo/geo-scorer'
import { SymbolTemplate } from '@/components/frontend/SymbolTemplate'
import { getRelatedSymbols } from '@/lib/seo/internal-linker'
import { mergeAdsConfig } from '@/lib/ads/config'
import { getRecommendedAffiliateProducts } from '@/lib/monetization/affiliate-matcher'
import { getCurrentSiteBranding, resolveCurrentSite } from '@/lib/sites/resolver'

export const revalidate = 7200

async function loadSymbol(siteId: string | undefined, letter: string, slug: string) {
  return prisma.symbolEntry.findFirst({
    where: {
      ...(siteId ? { siteId } : {}),
      letter,
      slug,
    },
  })
}

export async function generateMetadata({ params }: { params: { letter: string; slug: string } }): Promise<Metadata> {
  const siteContext = await resolveCurrentSite()
  const [branding, symbol] = await Promise.all([
    getCurrentSiteBranding(),
    loadSymbol(siteContext.site.id, params.letter.toUpperCase(), params.slug),
  ])
  if (!symbol) return {}

  const dictionaryPath = branding.dictionaryPath || '/dictionar'
  return buildMetadata({
    siteUrl: branding.siteUrl,
    siteName: branding.siteName,
    title: symbol.metaTitle || symbol.name,
    description: symbol.metaDescription || symbol.shortDefinition,
    canonical: `${branding.siteUrl.replace(/\/$/, '')}${dictionaryPath}/${params.letter.toUpperCase()}/${params.slug}`,
  })
}

export default async function DictionarySymbolPage({ params }: { params: { letter: string; slug: string } }) {
  const siteContext = await resolveCurrentSite()
  const letter = params.letter.toUpperCase()
  if (!/^[A-Z]$/.test(letter)) return notFound()

  const symbol = await loadSymbol(siteContext.site.id, letter, params.slug)
  if (!symbol) return notFound()

  const [branding, related, sameLetter, affiliateProducts] = await Promise.all([
    getCurrentSiteBranding(),
    getRelatedSymbols({
      siteId: symbol.siteId,
      symbolId: symbol.id,
      name: symbol.name,
      shortDefinition: symbol.shortDefinition,
      fullContent: symbol.fullContent,
      relatedSlugs: Array.isArray(symbol.relatedSymbols) ? (symbol.relatedSymbols as string[]) : [],
      topicCluster: letter,
    }),
    prisma.symbolEntry.findMany({
      where: { siteId: symbol.siteId, letter },
      orderBy: { name: 'asc' },
      select: { slug: true, name: true },
    }),
    getRecommendedAffiliateProducts({
      templateType: 'symbol',
      title: symbol.name,
      categoryName: 'dictionar',
      categorySlug: 'dictionar',
      symbols: [symbol.name],
    }),
  ])

  const geo = calculateGeoScore({
    postType: 'SYMBOL',
    name: symbol.name,
    title: symbol.name,
    shortDefinition: symbol.shortDefinition,
    contentHtml: symbol.fullContent,
    contentJson: symbol.contentJson,
    metaTitle: symbol.metaTitle,
    metaDescription: symbol.metaDescription,
  }, { name: null })

  const currentIndex = sameLetter.findIndex((entry) => entry.slug === symbol.slug)
  const prevSymbol = currentIndex > 0 ? sameLetter[currentIndex - 1] : null
  const nextSymbol = currentIndex >= 0 && currentIndex < sameLetter.length - 1 ? sameLetter[currentIndex + 1] : null
  const dictionaryPath = branding.dictionaryPath || '/dictionar'

  const schema = generateSchema(
    {
      postType: 'SYMBOL',
      name: symbol.name,
      slug: `${dictionaryPath.replace(/^\//, '')}/${letter}/${symbol.slug}`,
      shortDefinition: symbol.shortDefinition,
      metaTitle: symbol.metaTitle,
      metaDescription: symbol.metaDescription,
      contentJson: symbol.contentJson,
      contentHtml: symbol.fullContent,
      directAnswer: geo.directAnswer,
    },
    { siteName: branding.siteName, siteUrl: branding.siteUrl },
    null,
    { speakableSections: geo.speakableSections },
  )

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <SymbolTemplate
        name={symbol.name}
        slug={symbol.slug}
        letter={letter}
        shortDefinition={symbol.shortDefinition}
        fullContent={symbol.fullContent}
        directAnswer={geo.directAnswer}
        llmSummary={geo.llmSummary}
        speakableSections={geo.speakableSections}
        relatedSymbols={related}
        prevSymbol={prevSymbol}
        nextSymbol={nextSymbol}
        adsConfig={mergeAdsConfig(branding.seoSettings?.adsConfig || branding.adsConfig)}
        pagePath={`${dictionaryPath}/${letter}/${symbol.slug}`}
        affiliateProducts={affiliateProducts}
        sitePackKey={branding.sitePack.key}
      />
    </>
  )
}



