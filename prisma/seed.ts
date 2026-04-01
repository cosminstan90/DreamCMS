import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('changeme123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@pagani.ro' },
    update: {},
    create: {
      email: 'admin@pagani.ro',
      name: 'Admin',
      passwordHash,
      role: 'ADMIN',
    },
  })

  const site = await prisma.site.upsert({
    where: { slug: 'pagani' },
    update: {},
    create: {
      name: 'Pagani',
      slug: 'pagani',
      primaryDomain: 'pagani.ro',
      secondaryDomains: ['www.pagani.ro'],
      siteUrl: 'https://pagani.ro',
      locale: 'ro',
      siteType: 'publisher',
      themeKey: 'pagani',
      templatePack: 'pagani',
      logoText: 'P',
      tagline: 'Vise, rugaciuni si ghiduri pentru suflet',
      description: 'Spatiu editorial dedicat interpretarii viselor, rugaciunilor si ghidurilor spirituale pentru publicul din Romania.',
      searchPath: '/cauta',
      dictionaryPath: '/dictionar',
      homepageSections: [
        {
          key: 'hero',
          enabled: true,
          title: 'Interpretarea viselor si rugaciuni',
          subtitle: 'Ghiduri onirice, rugaciuni si simboluri explicate clar, pentru cititori care cauta raspunsuri si liniste.',
        },
        { key: 'latestPosts', enabled: true, title: 'Ultimele articole', limit: 6 },
        { key: 'categories', enabled: true, title: 'Categorii', limit: 8 },
        { key: 'featuredSymbols', enabled: true, title: 'Featured symbols', limit: 6 },
        {
          key: 'newsletter',
          enabled: true,
          title: 'Aboneaza-te la Pagani',
          subtitle: 'Trimitem cele mai bune interpretari, rugaciuni si ghiduri noi.',
        },
      ],
      footerLinks: [
        { href: '/despre', label: 'Despre' },
        { href: '/contact', label: 'Contact' },
        { href: '/autori', label: 'Autori' },
      ],
    },
  })
  await prisma.seoSettings.upsert({
    where: { siteId: site.id },
    update: {},
    create: {
      id: 'default-seo',
      siteId: site.id,
      siteName: 'Pagani',
      siteUrl: 'https://pagani.ro',
    },
  })

  const angelicSite = await prisma.site.upsert({
    where: { slug: 'numarangelic' },
    update: {},
    create: {
      name: 'Numar Angelic',
      slug: 'numarangelic',
      primaryDomain: 'numarangelic.ro',
      secondaryDomains: ['www.numarangelic.ro'],
      siteUrl: 'https://numarangelic.ro',
      locale: 'ro',
      siteType: 'publisher',
      themeKey: 'numarangelic',
      templatePack: 'numarangelic',
      logoText: 'NA',
      tagline: 'Semnificatia numerelor angelice si sincronizarilor',
      description: 'Ghiduri despre numere angelice, secvente repetate si interpretari spirituale practice.',
      searchPath: '/cauta',
      footerLinks: [
        { href: '/despre', label: 'Despre' },
        { href: '/contact', label: 'Contact' },
        { href: '/autori', label: 'Autori' },
      ],
      homepageSections: [
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
  })

  await prisma.seoSettings.upsert({
    where: { siteId: angelicSite.id },
    update: {},
    create: {
      siteId: angelicSite.id,
      siteName: 'Numar Angelic',
      siteUrl: 'https://numarangelic.ro',
      defaultMetaTitle: 'Numar Angelic - Semnificatia numerelor',
      defaultMetaDesc: 'Interpretari pentru numere angelice si secvente repetitive, explicate clar pentru publicul din Romania.',
    },
  })

  await prisma.category.upsert({
    where: { siteId_slug: { siteId: angelicSite.id, slug: 'numere-angelice' } },
    update: {},
    create: { siteId: angelicSite.id, name: 'Numere Angelice', slug: 'numere-angelice' },
  })

  await prisma.category.upsert({
    where: { siteId_slug: { siteId: angelicSite.id, slug: 'sincronicitati' } },
    update: {},
    create: { siteId: angelicSite.id, name: 'Sincronicitati', slug: 'sincronicitati' },
  })

  const dictionar = await prisma.category.upsert({
    where: { siteId_slug: { siteId: site.id, slug: 'dictionar-simboluri' } },
    update: {},
    create: { siteId: site.id, name: 'Dictionar Simboluri', slug: 'dictionar-simboluri' },
  })

  await prisma.category.upsert({
    where: { siteId_slug: { siteId: site.id, slug: 'interpretare-vise' } },
    update: {},
    create: { siteId: site.id, name: 'Interpretare Vise', slug: 'interpretare-vise' },
  })

  await prisma.category.upsert({
    where: { siteId_slug: { siteId: site.id, slug: 'vise-frecvente' } },
    update: {},
    create: { siteId: site.id, name: 'Vise Frecvente', slug: 'vise-frecvente' },
  })

  await prisma.category.upsert({
    where: { siteId_slug: { siteId: site.id, slug: 'natura' } },
    update: {},
    create: { siteId: site.id, name: 'Natura', slug: 'natura', parentId: dictionar.id },
  })

  await prisma.category.upsert({
    where: { siteId_slug: { siteId: site.id, slug: 'oameni-relatii' } },
    update: {},
    create: { siteId: site.id, name: 'Oameni si Relatii', slug: 'oameni-relatii', parentId: dictionar.id },
  })

  await prisma.category.upsert({
    where: { siteId_slug: { siteId: site.id, slug: 'obiecte' } },
    update: {},
    create: { siteId: site.id, name: 'Obiecte', slug: 'obiecte', parentId: dictionar.id },
  })

  await prisma.category.upsert({
    where: { siteId_slug: { siteId: site.id, slug: 'emotii' } },
    update: {},
    create: { siteId: site.id, name: 'Emotii', slug: 'emotii', parentId: dictionar.id },
  })

  await prisma.category.upsert({
    where: { siteId_slug: { siteId: site.id, slug: 'rugaciuni' } },
    update: {},
    create: { siteId: site.id, name: 'Rugaciuni', slug: 'rugaciuni' },
  })

  console.log('Seeded successfully:', admin.email)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })

