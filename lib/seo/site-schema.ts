export type SiteSchemaInput = {
  siteUrl: string
  siteName: string
  searchPath?: string
  description?: string
}

function normalizeSiteUrl(siteUrl: string) {
  return siteUrl.replace(/\/$/, '')
}

export function generateSiteSchemas(input: SiteSchemaInput) {
  const siteUrl = normalizeSiteUrl(input.siteUrl || 'https://candvisam.ro')
  const siteName = input.siteName || 'Cand Visam'
  const searchPath = input.searchPath || '/cauta'
  const description = input.description || 'Platforma editoriala romaneasca despre interpretari de vise si simboluri onirice.'

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${siteUrl}#organization`,
        name: siteName,
        url: siteUrl,
        description,
      },
      {
        '@type': 'WebSite',
        '@id': `${siteUrl}#website`,
        name: siteName,
        url: siteUrl,
        publisher: { '@id': `${siteUrl}#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: `${siteUrl}${searchPath}?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  }
}