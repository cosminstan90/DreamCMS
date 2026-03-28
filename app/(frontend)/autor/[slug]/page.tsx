import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentSiteBranding, resolveCurrentSite } from '@/lib/sites/resolver'

export const revalidate = 3600

async function loadAuthor(siteId: string | undefined, slug: string) {
  return prisma.user.findFirst({
    where: { slug, publicProfile: true },
    select: {
      id: true,
      name: true,
      slug: true,
      headline: true,
      bio: true,
      credentials: true,
      methodology: true,
      expertise: true,
      trustStatement: true,
      posts: {
        where: { status: 'PUBLISHED', ...(siteId ? { siteId } : {}) },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          publishedAt: true,
          category: { select: { slug: true, name: true } },
        },
        orderBy: { publishedAt: 'desc' },
        take: 12,
      },
    },
  })
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const siteContext = await resolveCurrentSite()
  const author = await loadAuthor(siteContext.site.id, params.slug)
  if (!author) return {}

  const { siteName } = await getCurrentSiteBranding()

  return {
    title: `${author.name} - autor ${siteName}`,
    description: author.bio || author.headline || `Profil public pentru autorul ${author.name}.`,
  }
}

export default async function AuthorProfilePage({ params }: { params: { slug: string } }) {
  const siteContext = await resolveCurrentSite()
  const author = await loadAuthor(siteContext.site.id, params.slug)
  if (!author) return notFound()

  const branding = await getCurrentSiteBranding()
  const dreamy = branding.sitePack.key !== 'numarangelic'

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    description: author.bio || author.headline || undefined,
    knowsAbout: Array.isArray(author.expertise) ? author.expertise : [],
    url: `${branding.siteUrl}/autor/${author.slug}`,
  }

  if (!dreamy) {
    return (
      <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#fff4de_0%,_#fff9ef_42%,_#fffdf9_100%)] px-6 py-12 text-[#4c2d12]">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        <div className="mx-auto max-w-5xl">
          <nav className="mb-6 text-sm text-[#b2721e]">
            <Link href="/" className="hover:text-[#8a4b10]">Acasa</Link> / <Link href="/autori" className="hover:text-[#8a4b10]">Autori</Link> / {author.name}
          </nav>

          <section className="rounded-[32px] border border-[#f1ddbc] bg-[linear-gradient(135deg,#fffdfa,#fff3df)] p-8">
            <div className="text-xs uppercase tracking-[0.25em] text-[#b96b12]">Profil public autor</div>
            <h1 className="mt-3 font-serif text-4xl text-[#4c2d12] md:text-5xl">{author.name}</h1>
            {author.headline && <p className="mt-4 text-lg text-[#7c4810]">{author.headline}</p>}
            {author.credentials && <p className="mt-4 rounded-2xl border border-[#f3e0c4] bg-white/80 p-4 text-sm text-[#7c4810]">{author.credentials}</p>}
            {Array.isArray(author.expertise) && author.expertise.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {(author.expertise as string[]).map((item) => (
                  <span key={item} className="rounded-full border border-[#efcf9a] bg-white px-3 py-1 text-xs text-[#8a4b10]">{item}</span>
                ))}
              </div>
            )}
          </section>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {author.bio && (
              <section className="rounded-[2rem] border border-[#f1ddbc] bg-white p-6">
                <h2 className="text-xl font-semibold text-[#5b3411]">Despre autor</h2>
                <p className="mt-3 text-sm leading-7 text-[#7c4810]">{author.bio}</p>
              </section>
            )}
            {author.methodology && (
              <section className="rounded-[2rem] border border-[#f1ddbc] bg-white p-6">
                <h2 className="text-xl font-semibold text-[#5b3411]">Metodologie editoriala</h2>
                <p className="mt-3 text-sm leading-7 text-[#7c4810]">{author.methodology}</p>
              </section>
            )}
          </div>

          {author.trustStatement && (
            <section className="mt-6 rounded-[2rem] border border-[#f1ddbc] bg-white p-6">
              <h2 className="text-xl font-semibold text-[#5b3411]">Trust statement</h2>
              <p className="mt-3 text-sm leading-7 text-[#7c4810]">{author.trustStatement}</p>
            </section>
          )}

          <section className="mt-10">
            <h2 className="mb-4 font-serif text-2xl text-[#4c2d12]">Ghiduri publicate</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {author.posts.map((post) => (
                <Link key={post.id} href={`/${post.category?.slug || ''}/${post.slug}`} className="rounded-[2rem] border border-[#f1ddbc] bg-white p-5 transition-colors hover:border-[#efbf71]">
                  <div className="text-xs text-[#b2721e]">{post.category?.name || 'Ghid'} {post.publishedAt ? `| ${new Date(post.publishedAt).toLocaleDateString('ro-RO')}` : ''}</div>
                  <div className="mt-2 text-lg font-semibold text-[#5b3411]">{post.title}</div>
                  {post.excerpt && <p className="mt-2 text-sm text-[#7c4810]">{post.excerpt}</p>}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#fefdf8] px-6 py-12 text-[#2c2240]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div className="mx-auto max-w-5xl">
        <nav className="mb-6 text-sm text-[#6f5a92]">
          <Link href="/" className="hover:text-[#47306f]">Acasa</Link> / <Link href="/autori" className="hover:text-[#47306f]">Autori</Link> / {author.name}
        </nav>

        <section className="rounded-[32px] border border-[#e4daf5] bg-[radial-gradient(circle_at_top,#ffffff_0%,#f8f2ff_60%,#f1e7ff_100%)] p-8">
          <div className="text-xs uppercase tracking-[0.25em] text-[#7b67a5]">Profil public autor</div>
          <h1 className="mt-3 text-4xl font-semibold text-[#2f2050] md:text-5xl">{author.name}</h1>
          {author.headline && <p className="mt-4 text-lg text-[#5f4b80]">{author.headline}</p>}
          {author.credentials && <p className="mt-4 rounded-2xl border border-[#ece2fb] bg-white/80 p-4 text-sm text-[#4e3b74]">{author.credentials}</p>}
          {Array.isArray(author.expertise) && author.expertise.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {(author.expertise as string[]).map((item) => (
                <span key={item} className="rounded-full border border-[#ddd1f7] bg-white px-3 py-1 text-xs text-[#5f4b80]">{item}</span>
              ))}
            </div>
          )}
        </section>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {author.bio && (
            <section className="rounded-3xl border border-[#e5daf5] bg-white p-6">
              <h2 className="text-xl font-semibold text-[#2f2050]">Despre autor</h2>
              <p className="mt-3 text-sm leading-7 text-[#5f4b80]">{author.bio}</p>
            </section>
          )}
          {author.methodology && (
            <section className="rounded-3xl border border-[#e5daf5] bg-white p-6">
              <h2 className="text-xl font-semibold text-[#2f2050]">Metodologie editoriala</h2>
              <p className="mt-3 text-sm leading-7 text-[#5f4b80]">{author.methodology}</p>
            </section>
          )}
        </div>

        {author.trustStatement && (
          <section className="mt-6 rounded-3xl border border-[#e5daf5] bg-white p-6">
            <h2 className="text-xl font-semibold text-[#2f2050]">Trust statement</h2>
            <p className="mt-3 text-sm leading-7 text-[#5f4b80]">{author.trustStatement}</p>
          </section>
        )}

        <section className="mt-10">
          <h2 className="mb-4 text-2xl font-semibold text-[#2f2050]">Articole publicate</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {author.posts.map((post) => (
              <Link key={post.id} href={`/${post.category?.slug || ''}/${post.slug}`} className="rounded-3xl border border-[#e5daf5] bg-white p-5 transition-colors hover:border-[#cab5eb]">
                <div className="text-xs text-[#7b67a5]">{post.category?.name || 'Articol'} {post.publishedAt ? `| ${new Date(post.publishedAt).toLocaleDateString('ro-RO')}` : ''}</div>
                <div className="mt-2 text-lg font-semibold text-[#2f2050]">{post.title}</div>
                {post.excerpt && <p className="mt-2 text-sm text-[#5f4b80]">{post.excerpt}</p>}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
