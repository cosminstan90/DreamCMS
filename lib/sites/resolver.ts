import { cache } from 'react'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { defaultAdsConfig, mergeAdsConfig } from '@/lib/ads/config'
import { normalizeHomepageSections } from '@/lib/sites/homepage'
import { getSitePack } from '@/lib/sites/registry'
import type { ResolvedSiteConfig, SiteFooterLink } from '@/lib/sites/types'

function normalizeHost(value: string | null | undefined) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/:\d+$/, '')
    .replace(/\/$/, '')
}

function normalizeSiteUrl(value: string | null | undefined, fallbackHost: string) {
  const clean = String(value || '').trim()
  if (clean) return clean.replace(/\/$/, '')
  const host = fallbackHost || 'candvisam.ro'
  return `https://${host}`
}

function toFooterLinks(value: unknown): SiteFooterLink[] | undefined {
  if (!Array.isArray(value)) return undefined
  return value
    .filter((item): item is { href?: string; label?: string } => typeof item === 'object' && item !== null)
    .map((item) => ({ href: String(item.href || ''), label: String(item.label || '') }))
    .filter((item) => item.href && item.label)
}

export const resolveCurrentSite = cache(async () => {
  const headerStore = headers()
  const host = normalizeHost(headerStore.get('x-forwarded-host') || headerStore.get('host'))

  try {
    const sites = await prisma.site.findMany({ where: { isActive: true }, orderBy: { createdAt: 'asc' } })

    const matched = sites.find((site) => {
      const domains = [site.primaryDomain, ...(Array.isArray(site.secondaryDomains) ? site.secondaryDomains.map((item) => String(item)) : [])]
      return domains.map(normalizeHost).includes(host)
    }) || sites[0] || null

    const seoSettings = matched?.id
      ? await prisma.seoSettings.findUnique({ where: { siteId: matched.id } })
      : null

    const site: ResolvedSiteConfig = matched
      ? {
          id: matched.id,
          name: matched.name,
          slug: matched.slug,
          primaryDomain: matched.primaryDomain,
          siteUrl: normalizeSiteUrl(matched.siteUrl, matched.primaryDomain),
          locale: matched.locale || 'ro',
          siteType: matched.siteType || 'publisher',
          themeKey: matched.themeKey || 'candvisam',
          templatePack: matched.templatePack || 'candvisam',
          logoText: matched.logoText,
          tagline: matched.tagline,
          description: matched.description,
          searchPath: matched.searchPath || '/cauta',
          dictionaryPath: matched.dictionaryPath || '/dictionar',
          footerLinks: toFooterLinks(matched.footerLinks),
          featureFlags: (matched.featureFlags && typeof matched.featureFlags === 'object' ? matched.featureFlags as Record<string, unknown> : null),
          isActive: matched.isActive,
        }
      : {
          name: seoSettings?.siteName || 'Cand Visam',
          slug: 'candvisam',
          primaryDomain: host || 'candvisam.ro',
          siteUrl: normalizeSiteUrl(seoSettings?.siteUrl, host || 'candvisam.ro'),
          locale: 'ro',
          siteType: 'publisher',
          themeKey: 'candvisam',
          templatePack: 'candvisam',
          logoText: 'CV',
          tagline: 'Interpretari de vise, simboluri si ghiduri onirice',
          description: seoSettings?.defaultMetaDesc || 'Interpretari de vise si simboluri onirice.',
          searchPath: '/cauta',
          dictionaryPath: '/dictionar',
          isActive: true,
        }

    const pack = getSitePack(site.templatePack)
    const homepageSections = normalizeHomepageSections(
      matched?.homepageSections,
      pack.homepage.sections,
    )

    return {
      host,
      site: {
        ...site,
        homepageSections,
      },
      seoSettings,
      sitePack: pack,
      adsConfig: mergeAdsConfig(seoSettings?.adsConfig || defaultAdsConfig),
    }
  } catch {
    const site: ResolvedSiteConfig = {
      name: 'Cand Visam',
      slug: 'candvisam',
      primaryDomain: host || 'candvisam.ro',
      siteUrl: normalizeSiteUrl('', host || 'candvisam.ro'),
      locale: 'ro',
      siteType: 'publisher',
      themeKey: 'candvisam',
      templatePack: 'candvisam',
      logoText: 'CV',
      tagline: 'Interpretari de vise, simboluri si ghiduri onirice',
      description: 'Interpretari de vise si simboluri onirice.',
      searchPath: '/cauta',
      dictionaryPath: '/dictionar',
      isActive: true,
    }

    return {
      host,
      site: {
        ...site,
        homepageSections: getSitePack(site.templatePack).homepage.sections,
      },
      seoSettings: null,
      sitePack: getSitePack(site.templatePack),
      adsConfig: defaultAdsConfig,
    }
  }
})

export async function getCurrentSiteBranding() {
  const context = await resolveCurrentSite()
  return {
    siteName: context.site.name,
    siteUrl: context.site.siteUrl,
    locale: context.site.locale,
    searchPath: context.site.searchPath || context.sitePack.routes.searchPath,
    dictionaryPath: context.site.dictionaryPath || context.sitePack.routes.dictionaryPath || null,
    sitePack: context.sitePack,
    seoSettings: context.seoSettings,
    adsConfig: context.adsConfig,
  }
}
