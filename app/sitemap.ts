import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { getRequiredCurrentSite } from '@/lib/sites/context'

export const dynamic = 'force-dynamic'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { site, seoSettings } = await getRequiredCurrentSite()
  const siteUrl = (seoSettings?.siteUrl || site.siteUrl || 'https://candvisam.ro').replace(/\/$/, '')

  const [posts, symbols, categories] = await Promise.all([
    prisma.post.findMany({
      where: { siteId: site.id, status: 'PUBLISHED' },
      select: {
        slug: true,
        updatedAt: true,
        category: { select: { slug: true } },
      },
    }),
    prisma.symbolEntry.findMany({
      where: { siteId: site.id, publishedAt: { not: null } },
      select: { slug: true, letter: true, updatedAt: true },
    }),
    prisma.category.findMany({ where: { siteId: site.id }, select: { slug: true, createdAt: true } }),
  ])

  const dictionaryPath = site.dictionaryPath || '/dictionar'
  const entries: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      priority: 1,
      changeFrequency: 'daily',
      lastModified: new Date(),
    },
    {
      url: `${siteUrl}${dictionaryPath}`,
      priority: 0.9,
      changeFrequency: 'weekly',
      lastModified: new Date(),
    },
    ...LETTERS.map((letter) => ({
      url: `${siteUrl}${dictionaryPath}/${letter}`,
      priority: 0.7,
      changeFrequency: 'weekly' as const,
      lastModified: new Date(),
    })),
  ]

  for (const category of categories) {
    entries.push({
      url: `${siteUrl}/${category.slug}`,
      priority: 0.8,
      changeFrequency: 'weekly',
      lastModified: category.createdAt,
    })
  }

  for (const post of posts) {
    if (!post.category?.slug) continue
    entries.push({
      url: `${siteUrl}/${post.category.slug}/${post.slug}`,
      priority: 0.6,
      changeFrequency: 'monthly',
      lastModified: post.updatedAt,
    })
  }

  for (const symbol of symbols) {
    entries.push({
      url: `${siteUrl}${dictionaryPath}/${symbol.letter}/${symbol.slug}`,
      priority: 0.7,
      changeFrequency: 'weekly',
      lastModified: symbol.updatedAt,
    })
  }

  return entries
}
