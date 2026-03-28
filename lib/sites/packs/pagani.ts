import { DEFAULT_SITE_EDITOR_FEATURES } from '@/lib/sites/editor-features'
import type { SitePack } from '@/lib/sites/types'

export const paganiSitePack: SitePack = {
  key: 'pagani',
  displayName: 'Cand Visam',
  shell: {
    logoText: 'CV',
    headerTagline: 'Interpretari de vise, simboluri si ghiduri onirice',
    footerDescription:
      'Candvisam.ro este construit ca o biblioteca editoriala despre vise, simboluri si context psihologic, cu accent pe claritate, transparenta si continut util pentru cititorii din Romania.',
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
    homeTitle: 'Interpretari vise si dictionar simboluri',
    dictionaryCta: 'Exploreaza dictionarul',
    searchCta: 'Cauta in site',
  },
  homepage: {
    sections: [
      {
        key: 'hero',
        enabled: true,
        title: 'Interpretari vise si dictionar simboluri',
        subtitle: 'Ghiduri onirice explicate clar, pentru cititori care vor raspunsuri practice si context simbolic.',
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
        title: 'Aboneaza-te la Cand Visam',
        subtitle: 'Trimitem cele mai bune interpretari, ghiduri SEO-ready si simboluri noi.',
      },
    ],
  },
  features: {
    editor: DEFAULT_SITE_EDITOR_FEATURES,
  },
}
