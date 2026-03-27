export type AdRouteKey = 'homepage' | 'category' | 'article' | 'dictionaryIndex' | 'symbolPage'

export type AdsConfig = {
  provider: 'adsense' | 'custom'
  enabled: boolean
  publisherId: string
  scriptUrl: string
  maxAdsPerPage: number
  minWordsForAds: number
  routes: Record<AdRouteKey, boolean>
  slots: {
    header: string
    inContent1: string
    inContent2: string
    sidebar: string
    footer: string
    mobileSticky: string
  }
}

export const defaultAdsConfig: AdsConfig = {
  provider: 'adsense',
  enabled: false,
  publisherId: '',
  scriptUrl: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
  maxAdsPerPage: 3,
  minWordsForAds: 350,
  routes: {
    homepage: true,
    category: true,
    article: true,
    dictionaryIndex: true,
    symbolPage: true,
  },
  slots: {
    header: '',
    inContent1: '',
    inContent2: '',
    sidebar: '',
    footer: '',
    mobileSticky: '',
  },
}

export function mergeAdsConfig(input: unknown): AdsConfig {
  const base = defaultAdsConfig
  if (!input || typeof input !== 'object' || Array.isArray(input)) return base
  const raw = input as Record<string, unknown>
  const routes = (raw.routes || {}) as Record<string, unknown>
  const slots = (raw.slots || {}) as Record<string, unknown>

  return {
    provider: raw.provider === 'custom' ? 'custom' : 'adsense',
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : base.enabled,
    publisherId: typeof raw.publisherId === 'string' ? raw.publisherId : base.publisherId,
    scriptUrl: typeof raw.scriptUrl === 'string' && raw.scriptUrl ? raw.scriptUrl : base.scriptUrl,
    maxAdsPerPage: typeof raw.maxAdsPerPage === 'number' ? raw.maxAdsPerPage : base.maxAdsPerPage,
    minWordsForAds: typeof raw.minWordsForAds === 'number' ? raw.minWordsForAds : base.minWordsForAds,
    routes: {
      homepage: typeof routes.homepage === 'boolean' ? routes.homepage : base.routes.homepage,
      category: typeof routes.category === 'boolean' ? routes.category : base.routes.category,
      article: typeof routes.article === 'boolean' ? routes.article : base.routes.article,
      dictionaryIndex: typeof routes.dictionaryIndex === 'boolean' ? routes.dictionaryIndex : base.routes.dictionaryIndex,
      symbolPage: typeof routes.symbolPage === 'boolean' ? routes.symbolPage : base.routes.symbolPage,
    },
    slots: {
      header: typeof slots.header === 'string' ? slots.header : base.slots.header,
      inContent1: typeof slots.inContent1 === 'string' ? slots.inContent1 : base.slots.inContent1,
      inContent2: typeof slots.inContent2 === 'string' ? slots.inContent2 : base.slots.inContent2,
      sidebar: typeof slots.sidebar === 'string' ? slots.sidebar : base.slots.sidebar,
      footer: typeof slots.footer === 'string' ? slots.footer : base.slots.footer,
      mobileSticky: typeof slots.mobileSticky === 'string' ? slots.mobileSticky : base.slots.mobileSticky,
    },
  }
}

export function routeAdsEnabled(config: AdsConfig, route: AdRouteKey) {
  return config.enabled && config.routes[route]
}
