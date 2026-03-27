import Link from 'next/link'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { getCurrentSiteBranding, resolveCurrentSite } from '@/lib/sites/resolver'

export const revalidate = 3600

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getCurrentSiteBranding()
  return {
    title: `Autori - ${branding.siteName}`,
    description: `Cunoaste echipa editoriala din spatele continutului ${branding.siteName} si metodologiile folosite in publicare.`,
  }
}

export default async function AuthorsIndexPage() {
  const branding = await getCurrentSiteBranding()
  const siteContext = await resolveCurrentSite()

  const authors = await prisma.user.findMany({
    where: { publicProfile: true },
    select: {
      id: true,
      name: true,
      slug: true,
      headline: true,
      bio: true,
      expertise: true,
      posts: {
        where: { status: 'PUBLISHED', ...(siteContext.site.id ? { siteId: siteContext.site.id } : {}) },
        select: { id: true },
      },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <main className="min-h-screen bg-[#fefdf8] px-6 py-12 text-[#2c2240]">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[32px] border border-[#e4daf5] bg-[radial-gradient(circle_at_top,#ffffff_0%,#f8f2ff_60%,#f1e7ff_100%)] p-8">
          <div className="text-xs uppercase tracking-[0.25em] text-[#7b67a5]">Echipa editoriala</div>
          <h1 className="mt-3 text-4xl font-semibold text-[#2f2050] md:text-5xl">Autori si metodologie</h1>
          <p className="mt-4 max-w-3xl text-lg text-[#5f4b80]">Fiecare profil public explica experienta relevanta, metodologia si ariile de expertiza folosite in continutul publicat pe {branding.siteName}.</p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {authors.map((author) => (
            <article key={author.id} className="rounded-3xl border border-[#e5daf5] bg-white p-6">
              <div className="text-2xl font-semibold text-[#2f2050]">{author.name}</div>
              {author.headline && <p className="mt-2 text-sm text-[#5f4b80]">{author.headline}</p>}
              {author.bio && <p className="mt-4 text-sm leading-7 text-[#5f4b80]">{author.bio}</p>}
              {Array.isArray(author.expertise) && author.expertise.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {(author.expertise as string[]).map((item) => (
                    <span key={item} className="rounded-full border border-[#ddd1f7] bg-white px-3 py-1 text-xs text-[#5f4b80]">{item}</span>
                  ))}
                </div>
              )}
              <div className="mt-5 text-xs text-[#7b67a5]">Articole publicate: {author.posts.length}</div>
              {author.slug && <Link href={`/autor/${author.slug}`} className="mt-5 inline-flex rounded-full bg-[#2f2050] px-4 py-2 text-sm text-white">Vezi profilul</Link>}
            </article>
          ))}
        </div>
      </div>
    </main>
  )
}
