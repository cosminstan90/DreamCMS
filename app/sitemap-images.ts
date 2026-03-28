import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { getRequiredCurrentSite } from '@/lib/sites/context'

export const dynamic = 'force-dynamic'

type ImageEntry = MetadataRoute.Sitemap[number] & { images: string[] }

export default async function sitemapImages(): Promise<MetadataRoute.Sitemap> {
  const { site, seoSettings } = await getRequiredCurrentSite()
  const siteUrl = (seoSettings?.siteUrl || site.siteUrl || 'https://pagani.ro').replace(/\/$/, '')
  const dictionaryPath = site.dictionaryPath || '/dictionar'

  const [posts, symbols, media] = await Promise.all([
    prisma.post.findMany({
      where: { siteId: site.id, status: 'PUBLISHED', featuredImageId: { not: null } },
      select: { slug: true, category: { select: { slug: true } }, featuredImageId: true },
    }),
    prisma.symbolEntry.findMany({
      where: { siteId: site.id, publishedAt: { not: null } },
      select: { slug: true, letter: true, post: { select: { featuredImageId: true } } },
    }),
    prisma.media.findMany({ select: { id: true, url: true } }),
  ])

  const mediaMap = new Map(media.map((item) => [item.id, `${siteUrl}${item.url}`]))

  const entries: ImageEntry[] = []

  for (const post of posts) {
    if (!post.category?.slug || !post.featuredImageId) continue
    const image = mediaMap.get(post.featuredImageId)
    if (!image) continue
    entries.push({
      url: `${siteUrl}/${post.category.slug}/${post.slug}`,
      images: [image],
    })
  }

  for (const symbol of symbols) {
    const imageId = symbol.post?.featuredImageId
    if (!imageId) continue
    const image = mediaMap.get(imageId)
    if (!image) continue
    entries.push({
      url: `${siteUrl}${dictionaryPath}/${symbol.letter}/${symbol.slug}`,
      images: [image],
    })
  }

  return entries as unknown as MetadataRoute.Sitemap
}
