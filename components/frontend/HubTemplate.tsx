import Link from 'next/link'
import { prepareHtmlForRendering, extractH2FromHtml, readingTimeFromHtml } from '@/lib/frontend/content'
import { NewsletterCta } from '@/components/frontend/NewsletterCta'
import { AuthorTrustCard } from '@/components/frontend/AuthorTrustCard'
import { MonetizationDisclosure } from '@/components/frontend/MonetizationDisclosure'

type BreadcrumbItem = { name: string; href: string }

type RelatedPost = {
  id: string
  title: string
  slug: string
  category?: { slug: string; name: string } | null
}

type HubTemplateProps = {
  title: string
  excerpt?: string | null
  contentHtml: string
  authorName?: string | null
  authorProfile?: {
    slug?: string | null
    headline?: string | null
    bio?: string | null
    credentials?: string | null
    methodology?: string | null
    expertise?: string[]
    trustStatement?: string | null
  } | null
  publishedAt?: Date | string | null
  breadcrumbs: BreadcrumbItem[]
  clusterName?: string | null
  supportAngles?: string[]
  keywords?: string[]
  relatedPosts: RelatedPost[]
  pagePath: string
  sitePackKey?: string
}

export function HubTemplate({
  title,
  excerpt,
  contentHtml,
  authorName,
  authorProfile,
  publishedAt,
  breadcrumbs,
  clusterName,
  supportAngles = [],
  keywords = [],
  relatedPosts,
  pagePath,
  sitePackKey,
}: HubTemplateProps) {
  const safeHtml = prepareHtmlForRendering(contentHtml || '')
  const { minutes } = readingTimeFromHtml(safeHtml)
  const toc = extractH2FromHtml(safeHtml)
  const dreamy = sitePackKey !== 'numarangelic'

  if (!dreamy) {
    return (
      <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#fff4de_0%,_#fff9ef_42%,_#fffdf9_100%)] text-[#4c2d12]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <nav className="mb-6 flex flex-wrap gap-2 text-sm text-[#b2721e]">
            {breadcrumbs.map((item, index) => (
              <span key={item.href}>
                <Link href={item.href} className="hover:text-[#8a4b10]">
                  {item.name}
                </Link>
                {index < breadcrumbs.length - 1 ? ' / ' : ''}
              </span>
            ))}
          </nav>

          <section className="rounded-[32px] border border-[#f1ddbc] bg-[linear-gradient(135deg,#fffdfa,#fff3df)] p-8">
            <div className="text-xs uppercase tracking-[0.25em] text-[#b96b12]">Hub editorial</div>
            <h1 className="mt-3 font-serif text-4xl leading-tight text-[#4c2d12] md:text-5xl">{title}</h1>
            {excerpt && <p className="mt-4 max-w-3xl text-lg text-[#7c4810]">{excerpt}</p>}
            <div className="mt-5 flex flex-wrap gap-3 text-sm text-[#7c4810]">
              <span>{clusterName || 'Cluster principal'}</span>
              <span>{authorName || 'Echipa Numar Angelic'}</span>
              <span>{publishedAt ? new Date(publishedAt).toLocaleDateString('ro-RO') : ''}</span>
              <span>{minutes} min citire</span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[#f3e0c4] bg-white/85 p-5">
                <div className="text-xs uppercase tracking-wide text-[#b96b12]">Structura cluster</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {supportAngles.map((item) => (
                    <span key={item} className="rounded-full border border-[#efcf9a] bg-white px-3 py-1 text-xs text-[#8a4b10]">{item}</span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[#f3e0c4] bg-white/85 p-5">
                <div className="text-xs uppercase tracking-wide text-[#b96b12]">Keywords prioritare</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {keywords.map((item) => (
                    <span key={item} className="rounded-full border border-[#efcf9a] bg-white px-3 py-1 text-xs text-[#8a4b10]">{item}</span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {toc.length > 2 && (
            <aside className="mt-8 rounded-[2rem] border border-[#f1ddbc] bg-white p-5">
              <h2 className="mb-3 text-base font-semibold text-[#8a4b10]">Ce acopera acest hub</h2>
              <ul className="space-y-2 text-sm text-[#7c4810]">
                {toc.map((entry) => (
                  <li key={entry.id}>
                    <a href={`#${entry.id}`} className="hover:text-[#8a4b10]">
                      {entry.text}
                    </a>
                  </li>
                ))}
              </ul>
            </aside>
          )}

          <AuthorTrustCard
            name={authorName}
            slug={authorProfile?.slug}
            headline={authorProfile?.headline}
            bio={authorProfile?.bio}
            credentials={authorProfile?.credentials}
            methodology={authorProfile?.methodology}
            expertise={authorProfile?.expertise || []}
            trustStatement={authorProfile?.trustStatement}
          />

          <article className="prose prose-lg mt-10 max-w-none prose-headings:font-serif prose-headings:text-[#4c2d12] prose-a:text-[#c26c12] prose-strong:text-[#5b3411]" dangerouslySetInnerHTML={{ __html: safeHtml }} />

          <MonetizationDisclosure hasAds hasAffiliate={false} />
          <NewsletterCta sourcePath={pagePath} variantStyle="angelic" title="Primeste hub-uri noi si ghiduri cu intentie mare" subtitle="Trimitem continut nou pentru iubire, twin flame, bani, manifestare si secvente numerice recurente." />

          {relatedPosts.length > 0 && (
            <section className="mt-14">
              <h2 className="mb-4 font-serif text-2xl text-[#4c2d12]">Pagini suport din acest cluster</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {relatedPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/${post.category?.slug || ''}/${post.slug}`}
                    className="rounded-[2rem] border border-[#f1ddbc] bg-white p-4 transition-colors hover:border-[#efbf71]"
                  >
                    <div className="mb-1 text-sm text-[#b2721e]">{post.category?.name || 'Ghid suport'}</div>
                    <div className="font-semibold text-[#5b3411]">{post.title}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#fefdf8] text-[#2c2240]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <nav className="mb-6 flex flex-wrap gap-2 text-sm text-[#6f5a92]">
          {breadcrumbs.map((item, index) => (
            <span key={item.href}>
              <Link href={item.href} className="hover:text-[#47306f]">
                {item.name}
              </Link>
              {index < breadcrumbs.length - 1 ? ' / ' : ''}
            </span>
          ))}
        </nav>

        <section className="rounded-[32px] border border-[#e2d4f3] bg-[radial-gradient(circle_at_top,#ffffff_0%,#f8f1ff_55%,#efe7ff_100%)] p-8">
          <div className="text-xs uppercase tracking-[0.25em] text-[#7b67a5]">Hub editorial</div>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-[#2f2050] md:text-5xl">{title}</h1>
          {excerpt && <p className="mt-4 max-w-3xl text-lg text-[#5f4b80]">{excerpt}</p>}
          <div className="mt-5 flex flex-wrap gap-3 text-sm text-[#5f4b80]">
            <span>{clusterName || 'Cluster principal'}</span>
            <span>{authorName || 'Echipa Pagani'}</span>
            <span>{publishedAt ? new Date(publishedAt).toLocaleDateString('ro-RO') : ''}</span>
            <span>{minutes} min citire</span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/60 bg-white/80 p-5">
              <div className="text-xs uppercase tracking-wide text-[#7b67a5]">Structura cluster</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {supportAngles.map((item) => (
                  <span key={item} className="rounded-full bg-[#ede5ff] px-3 py-1 text-xs text-[#4b3479]">{item}</span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/60 bg-white/80 p-5">
              <div className="text-xs uppercase tracking-wide text-[#7b67a5]">Keywords prioritare</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {keywords.map((item) => (
                  <span key={item} className="rounded-full border border-[#d8c9f5] bg-white px-3 py-1 text-xs text-[#5f4b80]">{item}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {toc.length > 2 && (
          <aside className="mt-8 rounded-2xl border border-[#e7def5] bg-white p-5">
            <h2 className="mb-3 text-base font-semibold text-[#3f2b63]">Ce acopera acest hub</h2>
            <ul className="space-y-2 text-sm text-[#5f4b80]">
              {toc.map((entry) => (
                <li key={entry.id}>
                  <a href={`#${entry.id}`} className="hover:text-[#3f2b63]">
                    {entry.text}
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        )}

        <AuthorTrustCard
          name={authorName}
          slug={authorProfile?.slug}
          headline={authorProfile?.headline}
          bio={authorProfile?.bio}
          credentials={authorProfile?.credentials}
          methodology={authorProfile?.methodology}
          expertise={authorProfile?.expertise || []}
          trustStatement={authorProfile?.trustStatement}
        />

        <article className="prose prose-lg mt-10 max-w-none prose-headings:text-[#2f2050] prose-a:text-[#4f35a1] prose-strong:text-[#34255b]" dangerouslySetInnerHTML={{ __html: safeHtml }} />

        <MonetizationDisclosure hasAds hasAffiliate={false} />
        <NewsletterCta sourcePath={pagePath} variantStyle="dreamy" />

        {relatedPosts.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-4 text-2xl font-semibold text-[#2f2050]">Pagini suport din acest cluster</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {relatedPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/${post.category?.slug || ''}/${post.slug}`}
                  className="rounded-2xl border border-[#e6dff2] bg-white p-4 transition-colors hover:border-[#c9b5ea]"
                >
                  <div className="mb-1 text-sm text-[#7b67a5]">{post.category?.name || 'Articol suport'}</div>
                  <div className="font-semibold text-[#2f2050]">{post.title}</div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
