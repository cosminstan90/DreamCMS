import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { buildMetadata } from '@/lib/frontend/metadata'
import type { Metadata } from 'next'
import { generateSchema } from '@/lib/seo/schema-generator'
import { AdSlot } from '@/components/ads/AdSlot'
import { mergeAdsConfig } from '@/lib/ads/config'
import { getCurrentSiteBranding, resolveCurrentSite } from '@/lib/sites/resolver'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: { categorySlug: string } }): Promise<Metadata> {
  const [branding, siteContext] = await Promise.all([
    getCurrentSiteBranding(),
    resolveCurrentSite(),
  ])

  const category = await prisma.category.findFirst({
    where: {
      slug: params.categorySlug,
      ...(siteContext.site.id ? { siteId: siteContext.site.id } : {}),
    },
  })

  return buildMetadata({
    siteUrl: branding.siteUrl,
    siteName: branding.siteName,
    title: category?.metaTitle || category?.name || 'Categorie',
    description: category?.metaDesc || category?.description || 'Articole din categorie',
    canonical: `${branding.siteUrl.replace(/\/$/, '')}/${params.categorySlug}`,
  })
}

export default async function CategoryPage({ params, searchParams }: { params: { categorySlug: string }; searchParams: { page?: string } }) {
  const siteContext = await resolveCurrentSite()
  const page = Math.max(1, parseInt(searchParams.page || '1', 10))
  const pageSize = 12
  const skip = (page - 1) * pageSize

  const category = await prisma.category.findFirst({
    where: {
      slug: params.categorySlug,
      ...(siteContext.site.id ? { siteId: siteContext.site.id } : {}),
    },
  })
  if (!category) return notFound()

  const [posts, total, branding] = await Promise.all([
    prisma.post.findMany({
      where: {
        siteId: category.siteId,
        categoryId: category.id,
        status: 'PUBLISHED',
      },
      orderBy: { publishedAt: 'desc' },
      skip,
      take: pageSize,
      include: { category: { select: { slug: true, name: true } } },
    }),
    prisma.post.count({ where: { siteId: category.siteId, categoryId: category.id, status: 'PUBLISHED' } }),
    getCurrentSiteBranding(),
  ])

  const adsConfig = mergeAdsConfig(branding.seoSettings?.adsConfig || branding.adsConfig)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const schema = generateSchema(
    {
      postType: 'ARTICLE',
      title: category.name,
      slug: category.slug,
      contentJson: {},
      contentHtml: '',
      metaTitle: category.metaTitle,
      metaDescription: category.metaDesc,
    },
    { siteName: branding.siteName, siteUrl: branding.siteUrl },
    null,
  )

  return (
    <main className="min-h-screen bg-[#fefdf8] text-[#2c2240]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="mb-2 text-4xl font-semibold text-[#2f2050]">{category.name}</h1>
        <p className="mb-8 text-[#5f4b80]">{category.description || 'Articole publicate in aceasta categorie.'}</p>

        <div className="mb-8"><AdSlot config={adsConfig} route="category" slotKey="header" pagePath={`/${category.slug}`} /></div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.id} href={`/${category.slug}/${post.slug}`} className="rounded-2xl border border-[#e2d7fa] bg-white p-5 hover:border-[#bea8e8]">
              <div className="font-semibold text-[#34255b]">{post.title}</div>
              <p className="mt-2 text-sm text-[#5f4b80]">{post.excerpt || ''}</p>
            </Link>
          ))}
        </div>

        <div className="mt-8"><AdSlot config={adsConfig} route="category" slotKey="inContent1" pagePath={`/${category.slug}`} /></div>

        <div className="mt-8 flex gap-3">
          {page > 1 && <Link href={`/${category.slug}?page=${page - 1}`} className="rounded-lg border border-[#d7c8f0] bg-white px-4 py-2">Pagina anterioara</Link>}
          {page < totalPages && <Link href={`/${category.slug}?page=${page + 1}`} className="rounded-lg border border-[#d7c8f0] bg-white px-4 py-2">Pagina urmatoare</Link>}
        </div>

        <div className="mt-8"><AdSlot config={adsConfig} route="category" slotKey="footer" pagePath={`/${category.slug}`} /></div>
      </div>
    </main>
  )
}
