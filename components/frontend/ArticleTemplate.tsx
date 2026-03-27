import Link from 'next/link'
import Image from 'next/image'
import { prepareHtmlForRendering, extractH2FromHtml, readingTimeFromHtml } from '@/lib/frontend/content'
import { getAllowedDataNodesForSitePack } from '@/lib/sites/blocks'
import { AdSlot } from '@/components/ads/AdSlot'
import { AdsConfig, defaultAdsConfig } from '@/lib/ads/config'
import { RecommendedProducts } from '@/components/affiliate/RecommendedProducts'
import { NewsletterCta } from '@/components/frontend/NewsletterCta'
import { MonetizationDisclosure } from '@/components/frontend/MonetizationDisclosure'
import { AuthorTrustCard } from '@/components/frontend/AuthorTrustCard'

type RelatedPost = {
  id: string
  title: string
  slug: string
  category?: { slug: string; name: string } | null
}

type BreadcrumbItem = { name: string; href: string }

type AffiliateProductItem = {
  id: string
  title: string
  slug: string
  affiliateUrl: string
  image?: string | null
  priceText?: string | null
  badge?: string | null
  merchant?: string | null
  network?: string | null
  category?: string | null
}

type ArticleTemplateProps = {
  title: string
  contentHtml: string
  excerpt?: string | null
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
  featuredImage?: { url: string; width?: number | null; height?: number | null; altText?: string | null } | null
  breadcrumbs: BreadcrumbItem[]
  backToCategoryHref?: string
  relatedPosts: RelatedPost[]
  relatedTitle?: string
  directAnswer?: string | null
  llmSummary?: string | null
  speakableSections?: string[]
  adsConfig?: AdsConfig
  pagePath: string
  affiliateProducts?: AffiliateProductItem[]
  sitePackKey?: string
}

function splitHtmlAtMiddleParagraph(html: string) {
  const regex = /<\/p>/gi
  const matches: number[] = []
  let match = regex.exec(html)
  while (match) {
    matches.push(match.index)
    match = regex.exec(html)
  }

  if (matches.length < 4) return { top: html, bottom: '' }
  const middleIndex = Math.floor(matches.length * 0.42)
  const cutAt = matches[middleIndex]
  if (!cutAt) return { top: html, bottom: '' }
  const cutPosition = cutAt + 4
  return {
    top: html.slice(0, cutPosition),
    bottom: html.slice(cutPosition),
  }
}

export function ArticleTemplate(props: ArticleTemplateProps) {
  const {
    title,
    contentHtml,
    excerpt,
    authorName,
    authorProfile,
    publishedAt,
    featuredImage,
    breadcrumbs,
    backToCategoryHref,
    relatedPosts,
    relatedTitle = 'Articole conexe',
    directAnswer,
    llmSummary,
    speakableSections = [],
    adsConfig = defaultAdsConfig,
    pagePath,
    affiliateProducts = [],
    sitePackKey,
  } = props

  const safeHtml = prepareHtmlForRendering(contentHtml || '', {
    allowedDataNodes: getAllowedDataNodesForSitePack(sitePackKey, 'post'),
  })
  const { minutes, words } = readingTimeFromHtml(safeHtml)
  const h2List = extractH2FromHtml(safeHtml)
  const canRenderAds = words >= adsConfig.minWordsForAds
  const { top, bottom } = splitHtmlAtMiddleParagraph(safeHtml)

  return (
    <main className="min-h-screen bg-[#fefdf8] text-[#2c2240]">
      <div className="mx-auto max-w-5xl px-6 py-12">
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

        <h1 className="text-4xl font-semibold leading-tight text-[#2f2050] md:text-5xl">{title}</h1>
        {excerpt && <p className="mt-4 max-w-3xl text-lg text-[#5f4b80]">{excerpt}</p>}

        <div className="mt-6 flex flex-wrap gap-4 text-sm text-[#5f4b80]">
          <span>{authorName || 'Echipa Cand Visam'}</span>
          <span>{publishedAt ? new Date(publishedAt).toLocaleDateString() : ''}</span>
          <span>{minutes} min citire</span>
        </div>

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

        {(directAnswer || llmSummary) && (
          <section className="mt-6 rounded-2xl border border-[#d8c9f5] bg-white p-5">
            <div className="mb-2 text-xs uppercase tracking-wide text-[#7b67a5]">Interpretare rapida</div>
            {directAnswer && <p className="text-base font-medium text-[#2f2050]">{directAnswer}</p>}
            {llmSummary && <p className="mt-2 text-sm text-[#5f4b80]">{llmSummary}</p>}
          </section>
        )}

        {speakableSections.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {speakableSections.slice(0, 6).map((section) => (
              <span key={section} className="rounded-full border border-[#d7caef] bg-white px-3 py-1 text-xs text-[#5f4b80]">
                {section}
              </span>
            ))}
          </div>
        )}

        {canRenderAds && (
          <div className="mt-6">
            <AdSlot config={adsConfig} route="article" slotKey="inContent1" pagePath={pagePath} />
          </div>
        )}

        {featuredImage?.url && (
          <div className="mt-8 overflow-hidden rounded-3xl border border-[#e6dff2] bg-white">
            <Image
              src={featuredImage.url}
              alt={featuredImage.altText || title}
              width={featuredImage.width || 1200}
              height={featuredImage.height || 630}
              priority
              className="h-auto w-full"
            />
          </div>
        )}

        {h2List.length > 3 && (
          <aside className="mt-10 rounded-2xl border border-[#e7def5] bg-white/80 p-5">
            <h2 className="mb-3 text-base font-semibold text-[#3f2b63]">Cuprins</h2>
            <ul className="space-y-2 text-sm text-[#5f4b80]">
              {h2List.map((entry) => (
                <li key={entry.id}>
                  <a href={`#${entry.id}`} className="hover:text-[#3f2b63]">
                    {entry.text}
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        )}

        <article className="prose prose-lg mt-10 max-w-none prose-headings:text-[#2f2050] prose-a:text-[#4f35a1] prose-strong:text-[#34255b]" dangerouslySetInnerHTML={{ __html: top }} />

        {canRenderAds && bottom && (
          <div className="mt-8">
            <AdSlot config={adsConfig} route="article" slotKey="inContent2" pagePath={pagePath} />
          </div>
        )}

        {bottom && <article className="prose prose-lg mt-8 max-w-none prose-headings:text-[#2f2050] prose-a:text-[#4f35a1] prose-strong:text-[#34255b]" dangerouslySetInnerHTML={{ __html: bottom }} />}

        <MonetizationDisclosure hasAffiliate={affiliateProducts.length > 0} hasAds={canRenderAds} />

        <NewsletterCta sourcePath={pagePath} />

        <RecommendedProducts products={affiliateProducts} pagePath={pagePath} templateType="article" />

        {canRenderAds && (
          <div className="mt-8">
            <AdSlot config={adsConfig} route="article" slotKey="footer" pagePath={pagePath} />
          </div>
        )}

        {relatedPosts.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-4 text-2xl font-semibold text-[#2f2050]">{relatedTitle}</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {relatedPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/${post.category?.slug || ''}/${post.slug}`}
                  className="rounded-2xl border border-[#e6dff2] bg-white p-4 transition-colors hover:border-[#c9b5ea]"
                >
                  <div className="mb-1 text-sm text-[#7b67a5]">{post.category?.name || 'Articol'}</div>
                  <div className="font-semibold text-[#2f2050]">{post.title}</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {backToCategoryHref && (
          <div className="mt-10">
            <Link href={backToCategoryHref} className="font-medium text-[#4f35a1] hover:text-[#35246f]">
              Inapoi la categorie
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}


