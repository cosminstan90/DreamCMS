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
}: HubTemplateProps) {
  const safeHtml = prepareHtmlForRendering(contentHtml || '')
  const { minutes } = readingTimeFromHtml(safeHtml)
  const toc = extractH2FromHtml(safeHtml)

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
            <span>{authorName || 'Echipa Cand Visam'}</span>
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
        <NewsletterCta sourcePath={pagePath} />

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
