import { prisma } from '@/lib/prisma'
import { getRequiredCurrentSite } from '@/lib/sites/context'

export const dynamic = 'force-dynamic'

function escapeXml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const { site, seoSettings } = await getRequiredCurrentSite()
  const siteUrl = (seoSettings?.siteUrl || site.siteUrl || 'https://candvisam.ro').replace(/\/$/, '')

  const posts = await prisma.post.findMany({
    where: { siteId: site.id, status: 'PUBLISHED' },
    include: { category: { select: { name: true, slug: true } } },
    orderBy: { publishedAt: 'desc' },
    take: 20,
  })

  const items = posts
    .filter((post) => post.category?.slug)
    .map((post) => {
      const link = `${siteUrl}/${post.category!.slug}/${post.slug}`
      return `
      <item>
        <title>${escapeXml(post.title)}</title>
        <link>${link}</link>
        <guid>${link}</guid>
        <description>${escapeXml(post.excerpt || '')}</description>
        <pubDate>${new Date(post.publishedAt || post.createdAt).toUTCString()}</pubDate>
        <category>${escapeXml(post.category?.name || 'Articol')}</category>
      </item>`
    })
    .join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <rss version="2.0">
    <channel>
      <title>${escapeXml(seoSettings?.siteName || site.name)} - Feed</title>
      <link>${siteUrl}</link>
      <description>${escapeXml(seoSettings?.defaultMetaDesc || site.description || 'Ultimele articole publicate.')}</description>
      <language>ro-RO</language>
      ${items}
    </channel>
  </rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
