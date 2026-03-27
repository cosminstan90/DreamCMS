export type SiteFooterLink = {
  href: string
  label: string
}

export type HomepageSectionKey =
  | 'hero'
  | 'latestPosts'
  | 'categories'
  | 'featuredSymbols'
  | 'newsletter'

export type SiteHomepageSection = {
  key: HomepageSectionKey
  enabled: boolean
  title?: string
  subtitle?: string
  limit?: number
}

export type EditorBlockKey =
  | 'imageGallery'
  | 'quickAnswer'
  | 'dreamInterpretation'
  | 'prosConsMeaning'
  | 'whenToWorry'
  | 'expertTake'
  | 'symbolCard'
  | 'faq'
  | 'dreamSymbolsList'
  | 'callout'

export type EditorPanelKey = 'seo' | 'geo' | 'links'

export type SitePackEditorFeatures = {
  postBlocks: EditorBlockKey[]
  symbolBlocks: EditorBlockKey[]
  postPanels: EditorPanelKey[]
  symbolPanels: EditorPanelKey[]
  allowTopicClusters: boolean
  allowFeaturedImage: boolean
  allowRelatedSymbols: boolean
  allowRevisionHistory: boolean
}

export type PageType = 'CONTENT' | 'LANDING' | 'HUB' | 'SUPPORT'
export type TemplateType = 'ARTICLE' | 'DREAM' | 'SYMBOL' | 'HUB' | 'GUIDE' | 'LANDING'
export type VerticalType = 'DREAMS' | 'SYMBOLS' | 'ANGEL_NUMBERS' | 'GENERIC'

export type SitePack = {
  key: string
  displayName: string
  shell: {
    logoText: string
    headerTagline: string
    footerDescription: string
    footerLinks: SiteFooterLink[]
  }
  routes: {
    searchPath: string
    dictionaryPath?: string | null
    authorsPath: string
  }
  labels: {
    homeTitle: string
    dictionaryCta: string
    searchCta: string
  }
  homepage: {
    sections: SiteHomepageSection[]
  }
  features: {
    editor: SitePackEditorFeatures
  }
}

export type ResolvedSiteConfig = {
  id?: string
  name: string
  slug: string
  primaryDomain: string
  siteUrl: string
  locale: string
  siteType: string
  themeKey: string
  templatePack: string
  logoText?: string | null
  tagline?: string | null
  description?: string | null
  searchPath: string
  dictionaryPath?: string | null
  footerLinks?: SiteFooterLink[]
  homepageSections?: SiteHomepageSection[]
  featureFlags?: Record<string, unknown> | null
  isActive: boolean
}
