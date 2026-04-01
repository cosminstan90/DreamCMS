import { DEFAULT_SITE_EDITOR_FEATURES } from '@/lib/sites/editor-features'
import type { SitePack } from '@/lib/sites/types'

export const paganiSitePack: SitePack = {
  key: 'pagani',
  displayName: 'Pagani',
  shell: {
    logoText: 'P',
    headerTagline: 'Vise, rugaciuni si ghiduri pentru suflet',
    footerDescription:
      'Pagani.ro este un spatiu editorial dedicat interpretarii viselor, rugaciunilor si ghidurilor spirituale — construit cu grija pentru cititorii din Romania.',
    footerLinks: [
      { href: '/despre', label: 'Despre' },
      { href: '/contact', label: 'Contact' },
      { href: '/autori', label: 'Autori' },
      { href: '/politica-editoriala', label: 'Politica editoriala' },
      { href: '/confidentialitate', label: 'Confidentialitate' },
      { href: '/termeni', label: 'Termeni' },
      { href: '/dezvaluire-afiliere', label: 'Dezvaluire afiliere' },
    ],
  },
  routes: {
    searchPath: '/cauta',
    dictionaryPath: '/dictionar',
    authorsPath: '/autori',
  },
  labels: {
    homeTitle: 'Interpretarea viselor si rugaciuni',
    dictionaryCta: 'Exploreaza dictionarul',
    searchCta: 'Cauta in site',
  },
  homepage: {
    sections: [
      {
        key: 'hero',
        enabled: true,
        title: 'Interpretarea viselor si rugaciuni',
        subtitle: 'Ghiduri onirice, rugaciuni si simboluri explicate clar, pentru cititori care cauta raspunsuri si liniste.',
      },
      {
        key: 'latestPosts',
        enabled: true,
        title: 'Ultimele articole',
        limit: 6,
      },
      {
        key: 'categories',
        enabled: true,
        title: 'Categorii',
        limit: 8,
      },
      {
        key: 'featuredSymbols',
        enabled: true,
        title: 'Featured symbols',
        limit: 6,
      },
      {
        key: 'newsletter',
        enabled: true,
        title: 'Aboneaza-te la Pagani',
        subtitle: 'Trimitem cele mai bune interpretari, rugaciuni si ghiduri noi.',
      },
    ],
  },
  features: {
    editor: DEFAULT_SITE_EDITOR_FEATURES,
  },
}
