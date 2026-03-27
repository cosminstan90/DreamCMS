import type { MetadataRoute } from 'next'
import { getRequiredCurrentSite } from '@/lib/sites/context'

export const dynamic = 'force-dynamic'

const AI_BOTS = ['GPTBot', 'CCBot', 'anthropic-ai', 'Claude-Web']

function hasAiBlockFlag(input: string) {
  const lower = input.toLowerCase()
  return lower.includes('block_ai_bots=true') || lower.includes('# block-ai:true')
}

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { site, seoSettings } = await getRequiredCurrentSite()
  const siteUrl = (seoSettings?.siteUrl || site.siteUrl || 'https://candvisam.ro').replace(/\/$/, '')
  const custom = seoSettings?.robotsTxt || ''

  const rules: MetadataRoute.Robots['rules'] = [
    {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'],
    },
  ]

  if (custom.trim()) {
    const disallowAll = /disallow:\s*\//i.test(custom)
    rules[0] = disallowAll
      ? { userAgent: '*', disallow: '/' }
      : { userAgent: '*', allow: '/', disallow: ['/admin/', '/api/'] }
  }

  if (hasAiBlockFlag(custom)) {
    for (const bot of AI_BOTS) {
      rules.push({ userAgent: bot, disallow: '/' })
    }
  }

  return {
    rules,
    sitemap: [`${siteUrl}/sitemap.xml`, `${siteUrl}/sitemap-images.xml`],
  }
}
