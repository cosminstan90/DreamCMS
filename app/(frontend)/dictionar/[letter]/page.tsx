import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { buildMetadata } from '@/lib/frontend/metadata'
import { getCurrentSiteBranding, resolveCurrentSite } from '@/lib/sites/resolver'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: { letter: string } }): Promise<Metadata> {
  const branding = await getCurrentSiteBranding()
  const dictionaryPath = branding.dictionaryPath || '/dictionar'

  return buildMetadata({
    siteUrl: branding.siteUrl,
    siteName: branding.siteName,
    title: `Simboluri cu litera ${params.letter.toUpperCase()}`,
    description: `Toate simbolurile din dictionar pentru litera ${params.letter.toUpperCase()}.`,
    canonical: `${branding.siteUrl.replace(/\/$/, '')}${dictionaryPath}/${params.letter.toUpperCase()}`,
  })
}

export default async function DictionaryLetterPage({ params }: { params: { letter: string } }) {
  const siteContext = await resolveCurrentSite()
  const branding = await getCurrentSiteBranding()
  const dictionaryPath = branding.dictionaryPath || '/dictionar'
  const letter = params.letter.toUpperCase()
  if (!/^[A-Z]$/.test(letter)) return notFound()

  const symbols = await prisma.symbolEntry.findMany({
    where: {
      letter,
      publishedAt: { not: null },
      ...(siteContext.site.id ? { siteId: siteContext.site.id } : {}),
    },
    orderBy: { name: 'asc' },
    select: { id: true, slug: true, name: true, shortDefinition: true, letter: true },
  })

  const siteUrl = branding.siteUrl.replace(/\/$/, '')
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: `Simboluri onirice cu litera ${letter}`,
    url: `${siteUrl}${dictionaryPath}/${letter}`,
    hasDefinedTerm: symbols.map((symbol) => ({
      '@type': 'DefinedTerm',
      name: symbol.name,
      description: symbol.shortDefinition,
      url: `${siteUrl}${dictionaryPath}/${letter}/${symbol.slug}`,
    })),
  }

  return (
    <main className="min-h-screen bg-[#fefdf8] text-[#2c2240]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="mx-auto max-w-5xl px-6 py-12">
        <nav className="text-sm text-[#6f5a92] mb-6">
          <Link href={dictionaryPath}>Dictionar</Link> / {letter}
        </nav>
        <h1 className="text-4xl font-semibold text-[#2f2050] mb-6">Simboluri cu litera {letter}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {symbols.map((symbol) => (
            <Link key={symbol.id} href={`${dictionaryPath}/${letter}/${symbol.slug}`} className="rounded-2xl border border-[#e2d7fa] bg-white p-5 hover:border-[#bea8e8]">
              <div className="font-semibold text-[#34255b]">{symbol.name}</div>
              <p className="text-sm text-[#5f4b80] mt-2">{symbol.shortDefinition}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
