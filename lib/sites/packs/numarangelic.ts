import type { SitePack } from '@/lib/sites/types'
import { DEFAULT_EDITOR_PANELS } from '@/lib/sites/editor-features'

export const numarAngelicSitePack: SitePack = {
  key: 'numarangelic',
  displayName: 'Numar Angelic',
  shell: {
    logoText: 'NA',
    headerTagline: 'Semnificatia numerelor angelice si mesaje spirituale',
    footerDescription:
      'numarangelic.ro ofera interpretari clare pentru secventele numerice, sincronizari si ghiduri spirituale aplicate.',
    footerLinks: [
      { href: '/despre', label: 'Despre' },
      { href: '/contact', label: 'Contact' },
      { href: '/autori', label: 'Autori' },
      { href: '/confidentialitate', label: 'Confidentialitate' },
      { href: '/termeni', label: 'Termeni' },
    ],
  },
  routes: {
    searchPath: '/cauta',
    authorsPath: '/autori',
  },
  labels: {
    homeTitle: 'Semnificatii numere angelice',
    dictionaryCta: 'Exploreaza ghidurile',
    searchCta: 'Cauta numere si interpretari',
  },
  homepage: {
    sections: [
      {
        key: 'hero',
        enabled: true,
        title: 'Semnificatia numerelor angelice',
        subtitle:
          'Interpretari pentru 111, 222, 333 si alte secvente numerice, explicate clar pentru context spiritual modern.',
      },
      { key: 'latestPosts', enabled: true, title: 'Ghiduri recente', limit: 6 },
      { key: 'categories', enabled: true, title: 'Teme principale', limit: 8 },
      { key: 'newsletter', enabled: true, title: 'Primeste noi interpretari pe email' },
      { key: 'featuredSymbols', enabled: false, title: 'Featured symbols', limit: 0 },
    ],
  },
  features: {
    editor: {
      postBlocks: ['imageGallery', 'quickAnswer', 'prosConsMeaning', 'whenToWorry', 'expertTake', 'faq', 'callout'],
      symbolBlocks: ['imageGallery', 'quickAnswer', 'prosConsMeaning', 'whenToWorry', 'expertTake', 'faq', 'callout'],
      postPanels: DEFAULT_EDITOR_PANELS,
      symbolPanels: ['seo', 'geo'],
      allowTopicClusters: true,
      allowFeaturedImage: true,
      allowRelatedSymbols: false,
      allowRevisionHistory: true,
    },
  },
}
