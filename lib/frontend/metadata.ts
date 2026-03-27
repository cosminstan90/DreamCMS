import type { Metadata } from 'next'

export type MetadataInput = {
  siteUrl: string
  siteName: string
  title: string
  description: string
  canonical: string
  noIndex?: boolean
  ogImage?: string | null
}

export function buildMetadata(input: MetadataInput): Metadata {
  const fullTitle = input.title.includes(input.siteName) ? input.title : `${input.title} | ${input.siteName}`

  return {
    metadataBase: new URL(input.siteUrl),
    title: fullTitle,
    description: input.description,
    alternates: { canonical: input.canonical },
    robots: input.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: 'article',
      title: fullTitle,
      description: input.description,
      url: input.canonical,
      siteName: input.siteName,
      images: input.ogImage ? [{ url: input.ogImage }] : undefined,
    },
    twitter: {
      card: input.ogImage ? 'summary_large_image' : 'summary',
      title: fullTitle,
      description: input.description,
      images: input.ogImage ? [input.ogImage] : undefined,
    },
  }
}