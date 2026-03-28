/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { generateSchema } from '@/lib/seo/schema-generator'
import { buildMetadata } from '@/lib/frontend/metadata'
import type { Metadata } from 'next'
import { AdSlot } from '@/components/ads/AdSlot'
import { NewsletterCta } from '@/components/frontend/NewsletterCta'
import { getCurrentSiteBranding, resolveCurrentSite } from '@/lib/sites/resolver'
import type { SiteHomepageSection } from '@/lib/sites/types'

export const revalidate = 1800

export async function generateMetadata(): Promise<Metadata> {
  const { siteName, siteUrl, seoSettings } = await getCurrentSiteBranding()

  return buildMetadata({
    siteUrl,
    siteName,
    title: seoSettings?.defaultMetaTitle || 'Interpretari vise si dictionar simboluri',
    description: seoSettings?.defaultMetaDesc || 'Ultimele interpretari de vise si simboluri onirice explicate.',
    canonical: siteUrl,
  })
}

export default async function HomePage() {
  const [branding, siteContext] = await Promise.all([
    getCurrentSiteBranding(),
    resolveCurrentSite(),
  ])
  const { siteName, siteUrl, seoSettings, adsConfig, dictionaryPath } = branding
  const homepageSections = siteContext.site.homepageSections || siteContext.sitePack.homepage.sections
  const sectionMap = new Map<string, any>(homepageSections.map((section: any) => [section.key, section]))
  const siteWhere = siteContext.site.id ? { siteId: siteContext.site.id } : undefined

  const postsLimit = sectionMap.get('latestPosts')?.enabled === false ? 0 : sectionMap.get('latestPosts')?.limit || 6
  const categoriesLimit = sectionMap.get('categories')?.enabled === false ? 0 : sectionMap.get('categories')?.limit || 8
  const symbolsLimit = sectionMap.get('featuredSymbols')?.enabled === false ? 0 : sectionMap.get('featuredSymbols')?.limit || 6

  let posts: any[] = []
  let categories: any[] = []
  let symbols: any[] = []

  try {
    const queries: Promise<unknown>[] = []

    if (postsLimit > 0) {
      queries.push(
        prisma.post.findMany({
          where: { ...siteWhere, status: 'PUBLISHED' },
          take: postsLimit,
          orderBy: { publishedAt: 'desc' },
          include: { category: { select: { slug: true, name: true } } },
        }),
      )
    }

    if (categoriesLimit > 0) {
      queries.push(prisma.category.findMany({ where: siteWhere, orderBy: { sortOrder: 'asc' }, take: categoriesLimit }))
    }

    if (symbolsLimit > 0) {
      queries.push(
        prisma.symbolEntry.findMany({ where: siteWhere, orderBy: { createdAt: 'desc' }, take: symbolsLimit }),
      )
    }

    const results = await Promise.all(queries)
    let index = 0

    if (postsLimit > 0) posts = (results[index++] as any[]) || []
    if (categoriesLimit > 0) categories = (results[index++] as any[]) || []
    if (symbolsLimit > 0) symbols = (results[index++] as any[]) || []
  } catch {
    // fallback during build when db is unavailable
  }

  const schema = generateSchema(
    {
      postType: 'ARTICLE',
      title: 'Homepage',
      slug: '',
      contentJson: {},
      contentHtml: '',
    },
    { siteName, siteUrl },
    null,
  )

  const renderSection = (section: SiteHomepageSection) => {
    if (!section.enabled) return null

    if (section.key === 'hero') {
      return (
        <section key={section.key} className="mb-12">
          <h1 className="mb-2 text-4xl font-semibold text-[#2f2050]">{section.title || siteName}</h1>
          <p className="mb-10 text-[#5f4b80]">
            {section.subtitle || seoSettings?.defaultMetaDesc || 'Interpretari de vise, simboluri si sensuri pentru experiente onirice.'}
          </p>
          <div className="mb-8"><AdSlot config={adsConfig} route="homepage" slotKey="header" pagePath="/" /></div>
        </section>
      )
    }

    if (section.key === 'latestPosts' && posts.length > 0) {
      return (
        <section key={section.key} className="mb-12">
          <h2 className="mb-4 text-2xl font-semibold text-[#2f2050]">{section.title || 'Ultimele articole'}</h2>
          {section.subtitle && <p className="mb-4 text-sm text-[#5f4b80]">{section.subtitle}</p>}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {posts.map((post) => (
              <Link key={post.id} href={`/${post.category?.slug || ''}/${post.slug}`} className="rounded-2xl border border-[#e2d7fa] bg-white p-5 hover:border-[#bea8e8]">
                <div className="mb-1 text-xs text-[#7a67a4]">{post.category?.name || 'Articol'}</div>
                <div className="font-semibold text-[#34255b]">{post.title}</div>
                <p className="mt-2 text-sm text-[#5f4b80]">{post.excerpt || ''}</p>
              </Link>
            ))}
          </div>
          <div className="mt-8"><AdSlot config={adsConfig} route="homepage" slotKey="inContent1" pagePath="/" /></div>
        </section>
      )
    }

    if (section.key === 'categories' && categories.length > 0) {
      return (
        <section key={section.key} className="mb-12">
          <h2 className="mb-4 text-2xl font-semibold text-[#2f2050]">{section.title || 'Categorii'}</h2>
          {section.subtitle && <p className="mb-4 text-sm text-[#5f4b80]">{section.subtitle}</p>}
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <Link key={category.id} href={`/${category.slug}`} className="rounded-xl border border-[#e2d7fa] bg-white px-4 py-2 hover:border-[#bea8e8]">
                {category.name}
              </Link>
            ))}
          </div>
          <div className="mt-8"><AdSlot config={adsConfig} route="homepage" slotKey="inContent2" pagePath="/" /></div>
        </section>
      )
    }

    if (section.key === 'featuredSymbols' && dictionaryPath && symbols.length > 0) {
      return (
        <section key={section.key} className="mb-12">
          <h2 className="mb-4 text-2xl font-semibold text-[#2f2050]">{section.title || 'Featured symbols'}</h2>
          {section.subtitle && <p className="mb-4 text-sm text-[#5f4b80]">{section.subtitle}</p>}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {symbols.map((symbol) => (
              <Link key={symbol.id} href={`${dictionaryPath}/${symbol.letter}/${symbol.slug}`} className="rounded-2xl border border-[#e2d7fa] bg-white p-5 hover:border-[#bea8e8]">
                <div className="mb-1 text-xs text-[#7a67a4]">Litera {symbol.letter}</div>
                <div className="font-semibold text-[#34255b]">{symbol.name}</div>
                <p className="mt-2 text-sm text-[#5f4b80]">{symbol.shortDefinition}</p>
              </Link>
            ))}
          </div>
        </section>
      )
    }

    if (section.key === 'newsletter') {
      return (
        <section key={section.key} className="mb-8">
          <NewsletterCta
            sourcePath="/"
            title={section.title || `Aboneaza-te la ${siteName}`}
            subtitle={section.subtitle || 'Trimitem cele mai bune interpretari, ghiduri SEO-ready si simboluri noi.'}
          />
        </section>
      )
    }

    return null
  }

  return (
    <main className="min-h-screen bg-[#fefdf8] text-[#2c2240]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="mx-auto max-w-6xl px-6 py-12">
        {homepageSections.map((section) => renderSection(section))}
        <div className="mt-8"><AdSlot config={adsConfig} route="homepage" slotKey="footer" pagePath="/" /></div>
      </div>
    </main>
  )
}

