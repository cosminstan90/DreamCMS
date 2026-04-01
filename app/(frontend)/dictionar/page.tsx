/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from 'next'
import { DictionaryTemplate } from '@/components/frontend/DictionaryTemplate'
import { prisma } from '@/lib/prisma'
import { buildMetadata } from '@/lib/frontend/metadata'
import { mergeAdsConfig } from '@/lib/ads/config'
import { getFrontendTemplatePack } from '@/lib/sites/frontend-registry'
import { getCurrentSiteBranding, resolveCurrentSite } from '@/lib/sites/resolver'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { siteUrl, siteName, dictionaryPath } = await getCurrentSiteBranding()

    return buildMetadata({
      siteUrl,
      siteName,
      title: 'Dictionar de simboluri din vise',
      description: 'Index complet A-Z cu simboluri onirice si interpretari detaliate.',
      canonical: `${siteUrl.replace(/\/$/, '')}${dictionaryPath || '/dictionar'}`,
    })
  } catch {
    return buildMetadata({
      siteUrl: 'https://pagani.ro',
      siteName: 'Pagani',
      title: 'Dictionar de simboluri din vise',
      description: 'Index complet A-Z cu simboluri onirice si interpretari detaliate.',
      canonical: 'https://pagani.ro/dictionar',
    })
  }
}

export default async function DictionaryIndexPage() {
  let settings = null
  let grouped: any[] = []
  let featuredSymbols: any[] = []

  try {
    const siteContext = await resolveCurrentSite()
    const siteWhere = siteContext.site.id ? { siteId: siteContext.site.id } : {}
    settings = siteContext.seoSettings
    ;[grouped, featuredSymbols] = await Promise.all([
      prisma.symbolEntry.groupBy({ by: ['letter'], where: { ...siteWhere, publishedAt: { not: null } }, _count: { _all: true } }),
      prisma.symbolEntry.findMany({
        where: { ...siteWhere, publishedAt: { not: null } },
        orderBy: { createdAt: 'desc' },
        take: 18,
        select: { id: true, name: true, slug: true, letter: true, shortDefinition: true },
      }),
    ])
  } catch {
    // fallback during build when db is unavailable
  }

  const branding = await getCurrentSiteBranding()
  const frontendTemplate = getFrontendTemplatePack(branding.sitePack.key)
  const siteUrl = branding.siteUrl.replace(/\/$/, '')
  const dictionaryPath = branding.dictionaryPath || '/dictionar'
  const adsConfig = mergeAdsConfig(settings?.adsConfig || branding.adsConfig)
  const letterCounts: Record<string, number> = {}
  for (let i = 65; i <= 90; i += 1) letterCounts[String.fromCharCode(i)] = 0
  grouped.forEach((item) => {
    letterCounts[item.letter.toUpperCase()] = item._count._all
  })

  const catalogSchema = {
    '@context': 'https://schema.org',
    '@type': 'DataCatalog',
    name: 'Dictionar de Simboluri Onirice',
    description: 'Catalog A-Z cu semnificatii ale simbolurilor din vise.',
    url: `${siteUrl}${dictionaryPath}`,
    hasPart: [
      {
        '@type': 'DefinedTermSet',
        name: 'Top simboluri populare',
        hasDefinedTerm: featuredSymbols.slice(0, 10).map((symbol: any) => ({
          '@type': 'DefinedTerm',
          name: symbol.name,
          description: symbol.shortDefinition,
          url: `${siteUrl}${dictionaryPath}/${symbol.letter}/${symbol.slug}`,
        })),
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogSchema) }} />
      <DictionaryTemplate
        letterCounts={letterCounts}
        featuredSymbols={featuredSymbols}
        adsConfig={adsConfig}
        pagePath={dictionaryPath}
        variant={frontendTemplate.dictionaryVariant}
      />
    </>
  )
}
