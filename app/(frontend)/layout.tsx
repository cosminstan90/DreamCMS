import { prisma } from '@/lib/prisma'
import { AdProvider } from '@/components/ads/AdProvider'
import { FrontendTracker } from '@/components/analytics/FrontendTracker'
import { WebVitalsTracker } from '@/components/analytics/WebVitalsTracker'
import { ClientErrorTracker } from '@/components/analytics/ClientErrorTracker'
import { PublicSiteShell } from '@/components/frontend/PublicSiteShell'
import { generateSiteSchemas } from '@/lib/seo/site-schema'
import { resolveCurrentSite } from '@/lib/sites/resolver'

export const dynamic = 'force-dynamic'

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const { site, sitePack, adsConfig } = await resolveCurrentSite()
  let categories: Array<{ id: string; name: string; slug: string }> = []

  try {
    categories = await prisma.category.findMany({
      where: site.id ? { siteId: site.id } : undefined,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      take: 6,
      select: { id: true, name: true, slug: true },
    })
  } catch {
    categories = []
  }

  const siteSchemas = generateSiteSchemas({
    siteUrl: site.siteUrl,
    siteName: site.name,
    searchPath: site.searchPath || sitePack.routes.searchPath,
    description: site.description || sitePack.shell.footerDescription,
  })

  return (
    <AdProvider config={adsConfig}>
      <FrontendTracker />
      <WebVitalsTracker />
      <ClientErrorTracker />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteSchemas) }} />
      <PublicSiteShell
        categories={categories}
        siteName={site.name}
        logoText={site.logoText || sitePack.shell.logoText}
        headerTagline={site.tagline || sitePack.shell.headerTagline}
        footerDescription={site.description || sitePack.shell.footerDescription}
        footerLinks={site.footerLinks || sitePack.shell.footerLinks}
        searchPath={site.searchPath || sitePack.routes.searchPath}
        dictionaryPath={site.dictionaryPath || sitePack.routes.dictionaryPath}
        dictionaryLabel="Dictionar A-Z"
        searchLabel={sitePack.labels.searchCta}
      >
        {children}
      </PublicSiteShell>
    </AdProvider>
  )
}
