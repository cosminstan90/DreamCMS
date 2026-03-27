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
  const { title, excerpt, contentHtml, breadcrumbs, authorName, authorProfile, publishedAt, featuredImage, relatedPosts, backToCategoryHref, directAnswer, llmSummary, speakableSections, dreamSymbols, interpretation, adsConfig, pagePath, affiliateProducts = [], sitePackKey } = props

  return (
    <div className="bg-[#fefdf8] text-[#2c2240]">
      <section className="mx-auto max-w-5xl px-6 pt-12">
        <div className="rounded-3xl border border-[#e2d7fa] bg-gradient-to-r from-[#f2ebff] to-[#eef1ff] p-8">
          <div className="mb-2 text-2xl">??</div>
          <h1 className="text-4xl font-semibold text-[#35255a]">{title}</h1>
          {excerpt && <p className="mt-3 text-[#5f4b80]">{excerpt}</p>}
        </div>

        {directAnswer && (
          <div className="mt-6 rounded-2xl border border-[#d8c9f5] bg-white p-5">
            <h2 className="mb-2 text-lg font-semibold text-[#35255a]">Interpretare rapida</h2>
            <p className="text-[#4f3d74]">{directAnswer}</p>
            {llmSummary && <p className="mt-2 text-sm text-[#6d5a95]">{llmSummary}</p>}
          </div>
        )}

        {dreamSymbols.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-3 text-xl font-semibold text-[#35255a]">Simboluri in acest vis</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {dreamSymbols.map((symbol) => (
                <Link key={`${symbol.slug}-${symbol.symbolName}`} href={`/dictionar/${symbol.slug.charAt(0).toUpperCase()}/${symbol.slug}`} className="rounded-xl border border-[#e2d7fa] bg-white p-4 hover:border-[#bba1eb]">
                  <div className="font-semibold text-[#3d2c66]">{symbol.symbolName}</div>
                  <div className="mt-1 text-sm text-[#6d5a95]">{symbol.shortMeaning || 'Vezi interpretare completa'}</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {(interpretation?.generalMeaning || interpretation?.psychologicalMeaning || interpretation?.spiritualMeaning) && (
          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
            {interpretation?.generalMeaning && <div className="rounded-xl border border-[#f2d7ad] bg-[#fff3df] p-4"><h3 className="mb-2 font-semibold">General</h3><p className="text-sm">{interpretation.generalMeaning}</p></div>}
            {interpretation?.psychologicalMeaning && <div className="rounded-xl border border-[#c6e8fa] bg-[#eaf8ff] p-4"><h3 className="mb-2 font-semibold">Psihologic</h3><p className="text-sm">{interpretation.psychologicalMeaning}</p></div>}
            {interpretation?.spiritualMeaning && <div className="rounded-xl border border-[#dfcff9] bg-[#f5efff] p-4"><h3 className="mb-2 font-semibold">Spiritual</h3><p className="text-sm">{interpretation.spiritualMeaning}</p></div>}
          </div>
        )}
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






