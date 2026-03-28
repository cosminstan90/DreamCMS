import Link from 'next/link'
import { ArticleTemplate } from './ArticleTemplate'
import { AdsConfig } from '@/lib/ads/config'

type DreamSymbol = { symbolName: string; slug: string; shortMeaning?: string }

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

type DreamTemplateProps = {
  title: string
  excerpt?: string | null
  contentHtml: string
  contentJson?: unknown
  breadcrumbs: Array<{ name: string; href: string }>
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
  relatedPosts: Array<{ id: string; title: string; slug: string; category?: { slug: string; name: string } | null }>
  backToCategoryHref?: string
  directAnswer?: string | null
  llmSummary?: string | null
  speakableSections?: string[]
  dreamSymbols: DreamSymbol[]
  interpretation?: {
    generalMeaning?: string
    psychologicalMeaning?: string
    spiritualMeaning?: string
  }
  adsConfig?: AdsConfig
  pagePath: string
  affiliateProducts?: AffiliateProductItem[]
  sitePackKey?: string
}

export function DreamTemplate(props: DreamTemplateProps) {
  const {
    title,
    excerpt,
    contentHtml,
    breadcrumbs,
    authorName,
    authorProfile,
    publishedAt,
    featuredImage,
    relatedPosts,
    backToCategoryHref,
    directAnswer,
    llmSummary,
    speakableSections,
    dreamSymbols,
    interpretation,
    adsConfig,
    pagePath,
    affiliateProducts = [],
    sitePackKey,
  } = props

  const dreamy = sitePackKey !== 'numarangelic'

  if (!dreamy) {
    return (
      <div className="bg-[#fefdf8] text-[#2c2240]">
        <section className="mx-auto max-w-5xl px-6 pt-12">
          <div className="rounded-3xl border border-[#e2d7fa] bg-gradient-to-r from-[#f2ebff] to-[#eef1ff] p-8">
            <div className="mb-2 text-2xl">Luna</div>
            <h1 className="text-4xl font-semibold text-[#35255a]">{title}</h1>
            {excerpt && <p className="mt-3 text-[#5f4b80]">{excerpt}</p>}
          </div>
        </section>
        <ArticleTemplate
          title={title}
          excerpt={excerpt}
          contentHtml={contentHtml}
          breadcrumbs={breadcrumbs}
          authorName={authorName}
          authorProfile={authorProfile}
          publishedAt={publishedAt}
          featuredImage={featuredImage}
          relatedPosts={relatedPosts}
          relatedTitle="Vise asemanatoare"
          directAnswer={directAnswer}
          llmSummary={llmSummary}
          speakableSections={speakableSections}
          backToCategoryHref={backToCategoryHref}
          adsConfig={adsConfig}
          pagePath={pagePath}
          affiliateProducts={affiliateProducts}
          sitePackKey={sitePackKey}
        />
      </div>
    )
  }

  return (
    <div className="bg-[radial-gradient(circle_at_top,_#f7f0ff_0%,_#fefdf8_42%,_#fcf8f2_100%)] text-[#2c2240]">
      <section className="relative isolate overflow-hidden px-6 pt-10 md:pt-14">
        <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_18%_18%,rgba(255,233,245,0.95),transparent_22%),radial-gradient(circle_at_84%_12%,rgba(227,213,255,0.78),transparent_24%)]" />
        <div className="relative mx-auto max-w-6xl rounded-[2.6rem] border border-[#e5d8f7] bg-white/70 p-8 shadow-[0_30px_90px_rgba(88,59,136,0.12)] backdrop-blur md:p-12">
          <div className="mb-4 inline-flex rounded-full border border-[#dccff5] bg-white px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[#7c67a6]">
            jurnal de vis
          </div>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(240px,0.45fr)]">
            <div>
              <div className="mb-4 text-4xl text-[#7b67a5]">&#9789;</div>
              <h1 className="max-w-3xl font-serif text-4xl leading-[0.95] text-[#2f2050] md:text-6xl">{title}</h1>
              {excerpt && <p className="mt-5 max-w-2xl text-lg leading-8 text-[#5f4b80]">{excerpt}</p>}
            </div>
            <div className="border-l border-[#ece2f8] pl-0 lg:pl-8">
              <div className="text-xs uppercase tracking-[0.24em] text-[#8b74ac]">Raspuns direct</div>
              <p className="mt-3 text-sm leading-7 text-[#5f4b80]">{directAnswer || 'Un rezumat calm si clar pentru diminetile in care vrei sa intelegi rapid mesajul emotional al visului.'}</p>
              {llmSummary && <p className="mt-4 text-sm leading-7 text-[#6d5a95]">{llmSummary}</p>}
            </div>
          </div>

          {dreamSymbols.length > 0 && (
            <div className="mt-10 border-t border-[#ece2f8] pt-8">
              <div className="mb-4 text-xs uppercase tracking-[0.24em] text-[#8b74ac]">Simboluri in acest vis</div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {dreamSymbols.map((symbol) => (
                  <Link key={`${symbol.slug}-${symbol.symbolName}`} href={`/dictionar/${symbol.slug.charAt(0).toUpperCase()}/${symbol.slug}`} className="border-t border-[#e6daf7] pt-4 transition-colors hover:border-[#c9b5ea]">
                    <div className="font-semibold text-[#3d2c66]">{symbol.symbolName}</div>
                    <div className="mt-2 text-sm leading-7 text-[#6d5a95]">{symbol.shortMeaning || 'Vezi interpretare completa'}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {(interpretation?.generalMeaning || interpretation?.psychologicalMeaning || interpretation?.spiritualMeaning) && (
            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
              {interpretation?.generalMeaning && <div className="rounded-[1.6rem] border border-[#f2d7ad] bg-[#fff5e7] p-5"><h3 className="mb-3 text-lg font-semibold text-[#64421c]">General</h3><p className="text-sm leading-7 text-[#6e5633]">{interpretation.generalMeaning}</p></div>}
              {interpretation?.psychologicalMeaning && <div className="rounded-[1.6rem] border border-[#d8ccf2] bg-[#f6f1ff] p-5"><h3 className="mb-3 text-lg font-semibold text-[#4a3572]">Psihologic</h3><p className="text-sm leading-7 text-[#5f4b80]">{interpretation.psychologicalMeaning}</p></div>}
              {interpretation?.spiritualMeaning && <div className="rounded-[1.6rem] border border-[#cde2f7] bg-[#eef7ff] p-5"><h3 className="mb-3 text-lg font-semibold text-[#2f597e]">Spiritual</h3><p className="text-sm leading-7 text-[#4f6b82]">{interpretation.spiritualMeaning}</p></div>}
            </div>
          )}
        </div>
      </section>

      <ArticleTemplate
        title={title}
        excerpt={excerpt}
        contentHtml={contentHtml}
        breadcrumbs={breadcrumbs}
        authorName={authorName}
        authorProfile={authorProfile}
        publishedAt={publishedAt}
        featuredImage={featuredImage}
        relatedPosts={relatedPosts}
        relatedTitle="Vise asemanatoare"
        directAnswer={directAnswer}
        llmSummary={llmSummary}
        speakableSections={speakableSections}
        backToCategoryHref={backToCategoryHref}
        adsConfig={adsConfig}
        pagePath={pagePath}
        affiliateProducts={affiliateProducts}
        sitePackKey={sitePackKey}
      />
    </div>
  )
}
