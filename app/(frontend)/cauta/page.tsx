import Link from 'next/link'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { SearchForm } from '@/components/frontend/SearchForm'
import { getCurrentSiteBranding, resolveCurrentSite } from '@/lib/sites/resolver'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ searchParams }: { searchParams: { q?: string } }): Promise<Metadata> {
  const branding = await getCurrentSiteBranding()
  const query = (searchParams.q || '').trim()
  return {
    title: query ? `Cautare: ${query}` : 'Cauta in site',
    description: `Cautare interna pentru articole si simboluri din ${branding.siteName}.`,
    robots: { index: false, follow: true },
  }
}

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const [branding, siteContext] = await Promise.all([
    getCurrentSiteBranding(),
    resolveCurrentSite(),
  ])
  const query = (searchParams.q || '').trim()
  const canSearch = query.length >= 2
  const siteWhere = siteContext.site.id ? { siteId: siteContext.site.id } : {}

  const [posts, symbols] = canSearch
    ? await Promise.all([
        prisma.post.findMany({
          where: {
            ...siteWhere,
            status: 'PUBLISHED',
            OR: [
              { title: { contains: query } },
              { excerpt: { contains: query } },
              { focusKeyword: { contains: query } },
            ],
          },
          take: 10,
          orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            category: { select: { slug: true, name: true } },
          },
        }),
        prisma.symbolEntry.findMany({
          where: {
            ...siteWhere,
            publishedAt: { not: null },
            OR: [
              { name: { contains: query } },
              { shortDefinition: { contains: query } },
            ],
          },
          take: 12,
          orderBy: [{ updatedAt: 'desc' }, { name: 'asc' }],
          select: { id: true, name: true, slug: true, letter: true, shortDefinition: true },
        }),
      ])
    : [[], []]

  return (
    <main className="min-h-screen bg-[#fefdf8] text-[#2c2240]">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <section className="rounded-[2rem] border border-[#e7dff4] bg-gradient-to-br from-white to-[#f5efff] p-8 shadow-[0_20px_60px_rgba(79,53,161,0.08)]">
          <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#7f67a8]">Cautare</div>
          <h1 className="text-4xl font-semibold text-[#2f2050] md:text-5xl">Gaseste rapid articole si simboluri</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#5f4b80] md:text-lg">
            Cauta direct in interpretari, dictionar si continut editorial pentru a ajunge mai repede la raspunsul de care ai nevoie.
          </p>
          <div className="mt-6 max-w-2xl">
            <SearchForm defaultValue={query} actionPath={branding.searchPath} />
          </div>
        </section>

        {!canSearch ? (
          <div className="mt-10 rounded-3xl border border-[#eadff8] bg-white p-8 text-[#5f4b80]">
            Introdu cel putin 2 caractere pentru a porni cautarea.
          </div>
        ) : (
          <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-3xl border border-[#eadff8] bg-white p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold text-[#2f2050]">Articole</h2>
                <span className="text-sm text-[#7c6a9f]">{posts.length} rezultate</span>
              </div>
              <div className="space-y-4">
                {posts.map((post) => (
                  <Link key={post.id} href={`/${post.category?.slug || ''}/${post.slug}`} className="block rounded-2xl border border-[#efe7f8] p-4 hover:border-[#d3c1ee]">
                    <div className="text-xs uppercase tracking-[0.15em] text-[#8872b1]">{post.category?.name || 'Articol'}</div>
                    <div className="mt-1 text-lg font-semibold text-[#2f2050]">{post.title}</div>
                    <p className="mt-2 text-sm text-[#5f4b80]">{post.excerpt || 'Deschide articolul pentru interpretarea completa.'}</p>
                  </Link>
                ))}
                {posts.length === 0 && <div className="text-sm text-[#7c6a9f]">Nu am gasit articole pentru acest termen.</div>}
              </div>
            </section>

            <section className="rounded-3xl border border-[#eadff8] bg-white p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold text-[#2f2050]">Simboluri</h2>
                <span className="text-sm text-[#7c6a9f]">{symbols.length} rezultate</span>
              </div>
              <div className="space-y-3">
                {symbols.map((symbol) => (
                  <Link key={symbol.id} href={`/dictionar/${symbol.letter}/${symbol.slug}`} className="block rounded-2xl border border-[#efe7f8] p-4 hover:border-[#d3c1ee]">
                    <div className="text-xs uppercase tracking-[0.15em] text-[#8872b1]">Litera {symbol.letter}</div>
                    <div className="mt-1 text-lg font-semibold text-[#2f2050]">{symbol.name}</div>
                    <p className="mt-2 text-sm text-[#5f4b80]">{symbol.shortDefinition}</p>
                  </Link>
                ))}
                {symbols.length === 0 && <div className="text-sm text-[#7c6a9f]">Nu am gasit simboluri pentru acest termen.</div>}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
