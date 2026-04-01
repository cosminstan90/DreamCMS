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
  const dreamy = sitePackKey !== 'numarangelic'

  if (dreamy) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f7f0ff_0%,_#fefdf8_34%,_#fcf8f2_100%)] text-[#2c2240]">
        <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
          <nav className="mb-8 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-[#8a74aa]">
            {breadcrumbs.map((item, index) => (
              <span key={item.href}>
                <Link href={item.href} className="hover:text-[#47306f]">
                  {item.name}
                </Link>
                {index < breadcrumbs.length - 1 ? ' / ' : ''}
              </span>
            ))}
          </nav>

          <section className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(280px,0.42fr)] lg:items-start">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-[#ded1f5] bg-white/75 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[#7b67a5] backdrop-blur">
                lectura ghidata
              </div>
              <h1 className="max-w-4xl font-serif text-4xl leading-[0.95] text-[#2f2050] md:text-6xl">
                {title}
              </h1>
              {excerpt && <p className="mt-5 max-w-2xl text-lg leading-8 text-[#5f4b80]">{excerpt}</p>}

              <div className="mt-8 flex flex-wrap gap-4 text-sm text-[#6a5a93]">
                <span>{authorName || 'Echipa Pagani'}</span>
                <span>{publishedAt ? new Date(publishedAt).toLocaleDateString() : ''}</span>
                <span>{minutes} min citire</span>
              </div>
            </div>

            <aside className="rounded-[2rem] border border-[#e6daf7] bg-white/70 p-6 backdrop-blur">
              {speakableSections.length > 0 && (
                <>
                  <div className="mb-3 text-xs uppercase tracking-[0.24em] text-[#8b74ac]">Repere rapide</div>
                  <div className="flex flex-wrap gap-2">
                    {speakableSections.slice(0, 6).map((section) => (
                      <span key={section} className="rounded-full border border-[#d7caef] bg-white px-3 py-1 text-xs text-[#5f4b80]">
                        {section}
                      </span>
                    ))}
                  </div>
                </>
              )}
              <div className={speakableSections.length > 0 ? 'mt-5 border-t border-[#e9e0f8] pt-5' : ''}>
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
              </div>
            </aside>
          </section>

          {(directAnswer || llmSummary) && (
            <section className="mt-8 rounded-[2rem] border border-[#dfd2f7] bg-white/85 p-6 backdrop-blur">
              <div className="mb-2 text-xs uppercase tracking-[0.22em] text-[#7b67a5]">Interpretare rapida</div>
              {directAnswer && <p className="max-w-3xl text-lg font-medium leading-8 text-[#2f2050]">{directAnswer}</p>}
              {llmSummary && <p className="mt-3 max-w-3xl text-sm leading-7 text-[#5f4b80]">{llmSummary}</p>}
            </section>
          )}

          {featuredImage?.url && (
            <div className="mt-8 overflow-hidden rounded-[2.3rem] border border-[#ebe2f7] bg-white/70 shadow-[0_24px_80px_rgba(80,54,128,0.1)]">
              <Image
                src={featuredImage.url}
                alt={featuredImage.altText || title}
                width={featuredImage.width || 1200}
                height={featuredImage.height || 630}
                priority
                className="h-auto w-full object-cover"
              />
            </div>
          )}

          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(260px,0.18fr)]">
            <div>
              {canRenderAds && (
                <div className="mb-8">
                  <AdSlot config={adsConfig} route="article" slotKey="inContent1" pagePath={pagePath} />
                </div>
              )}

              <article className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-[#2f2050] prose-p:leading-8 prose-a:text-[#4f35a1] prose-strong:text-[#34255b]" dangerouslySetInnerHTML={{ __html: top }} />

              {canRenderAds && bottom && (
                <div className="mt-10">
                  <AdSlot config={adsConfig} route="article" slotKey="inContent2" pagePath={pagePath} label="Pauza scurta in lectura" />
                </div>
              )}

              {bottom && <article className="prose prose-lg mt-10 max-w-none prose-headings:font-serif prose-headings:text-[#2f2050] prose-p:leading-8 prose-a:text-[#4f35a1] prose-strong:text-[#34255b]" dangerouslySetInnerHTML={{ __html: bottom }} />}
            </div>

            <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
              {h2List.length > 3 && (
                <div className="rounded-[1.8rem] border border-[#e7def5] bg-white/80 p-5 backdrop-blur">
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
                </div>
              )}

              <div className="rounded-[1.8rem] border border-[#e7def5] bg-[linear-gradient(180deg,#fffdfa,#faf5ff)] p-5">
                <div className="mb-3 text-[11px] uppercase tracking-[0.22em] text-[#8a74aa]">dupa aceasta pagina</div>
                <div className="space-y-3 text-sm leading-7 text-[#5f4b80]">
                  <div>1. Salveaza ideea centrala din raspunsul direct.</div>
                  <div>2. Continua cu un simbol recurent din vis.</div>
                  <div>3. Aboneaza-te pentru urmatoarele interpretari relevante.</div>
                </div>
                {backToCategoryHref && (
                  <Link href={backToCategoryHref} className="mt-4 inline-flex text-sm font-medium text-[#4f35a1] hover:text-[#35246f]">
                    Vezi mai multe din categorie
                  </Link>
                )}
              </div>

              <MonetizationDisclosure hasAffiliate={affiliateProducts.length > 0} hasAds={canRenderAds} />
            </aside>
          </div>

          <div className="mt-12">
            <RecommendedProducts products={affiliateProducts} pagePath={pagePath} templateType="article" />
          </div>

          <div className="mt-12">
            <NewsletterCta sourcePath={pagePath} variantStyle={dreamy ? 'dreamy' : 'angelic'} />
          </div>

          {canRenderAds && (
            <div className="mt-10">
              <AdSlot config={adsConfig} route="article" slotKey="footer" pagePath={pagePath} />
            </div>
          )}

          {relatedPosts.length > 0 && (
            <section className="mt-16">
              <div className="mb-5 text-xs uppercase tracking-[0.22em] text-[#8a74aa]">Mai departe</div>
              <h2 className="font-serif text-3xl text-[#2f2050]">{relatedTitle}</h2>
              <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
                {relatedPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/${post.category?.slug || ''}/${post.slug}`}
                    className="border-t border-[#e6daf7] pt-4 transition-colors hover:border-[#c9b5ea]"
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

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#fff4de_0%,_#fff9ef_42%,_#fffdf9_100%)] text-[#4c2d12]">
      <div className="mx-auto max-w-6xl px-6 py-10 md:py-14">
        <nav className="mb-8 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-[#b2721e]">
          {breadcrumbs.map((item, index) => (
            <span key={item.href}>
              <Link href={item.href} className="hover:text-[#8a4b10]">
                {item.name}
              </Link>
              {index < breadcrumbs.length - 1 ? ' / ' : ''}
            </span>
          ))}
        </nav>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(280px,0.42fr)] lg:items-start">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-[#f1d8ae] bg-white/90 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[#b96b12] backdrop-blur">
              ghid spiritual
            </div>
            <h1 className="max-w-4xl font-serif text-4xl leading-[0.95] text-[#4c2d12] md:text-6xl">
              {title}
            </h1>
            {excerpt && <p className="mt-5 max-w-2xl text-lg leading-8 text-[#7c4810]">{excerpt}</p>}

            <div className="mt-8 flex flex-wrap gap-4 text-sm text-[#9a5a15]">
              <span>{authorName || 'Echipa Numar Angelic'}</span>
              <span>{publishedAt ? new Date(publishedAt).toLocaleDateString() : ''}</span>
              <span>{minutes} min citire</span>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-[#f1ddbc] bg-white/80 p-6 backdrop-blur">
            {(directAnswer || llmSummary) && (
              <div>
                <div className="mb-3 text-xs uppercase tracking-[0.24em] text-[#b96b12]">raspuns rapid</div>
                {directAnswer && <p className="text-base font-medium leading-7 text-[#5b3411]">{directAnswer}</p>}
                {llmSummary && <p className="mt-3 text-sm leading-7 text-[#7c4810]">{llmSummary}</p>}
              </div>
            )}
            <div className={directAnswer || llmSummary ? 'mt-5 border-t border-[#f3e0c4] pt-5' : ''}>
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
            </div>
          </aside>
        </section>

        {featuredImage?.url && (
          <div className="mt-8 overflow-hidden rounded-[2.3rem] border border-[#f1ddbc] bg-white/70 shadow-[0_24px_80px_rgba(191,118,28,0.1)]">
            <Image
              src={featuredImage.url}
              alt={featuredImage.altText || title}
              width={featuredImage.width || 1200}
              height={featuredImage.height || 630}
              priority
              className="h-auto w-full object-cover"
            />
          </div>
        )}

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,0.82fr)_minmax(260px,0.18fr)]">
          <div>
            {canRenderAds && (
              <div className="mb-8">
                <AdSlot config={adsConfig} route="article" slotKey="inContent1" pagePath={pagePath} label="Descoperire sustinuta" />
              </div>
            )}

            <article className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-[#4c2d12] prose-p:leading-8 prose-a:text-[#c26c12] prose-strong:text-[#5b3411]" dangerouslySetInnerHTML={{ __html: top }} />

            {canRenderAds && bottom && (
              <div className="mt-10">
                <AdSlot config={adsConfig} route="article" slotKey="inContent2" pagePath={pagePath} label="Resurse sponsorizate" />
              </div>
            )}

            {bottom && <article className="prose prose-lg mt-10 max-w-none prose-headings:font-serif prose-headings:text-[#4c2d12] prose-p:leading-8 prose-a:text-[#c26c12] prose-strong:text-[#5b3411]" dangerouslySetInnerHTML={{ __html: bottom }} />}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            {h2List.length > 3 && (
              <div className="rounded-[1.8rem] border border-[#f1ddbc] bg-white/85 p-5 backdrop-blur">
                <h2 className="mb-3 text-base font-semibold text-[#8a4b10]">Pe scurt</h2>
                <ul className="space-y-2 text-sm text-[#7c4810]">
                  {h2List.map((entry) => (
                    <li key={entry.id}>
                      <a href={`#${entry.id}`} className="hover:text-[#8a4b10]">
                        {entry.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {speakableSections.length > 0 && (
              <div className="rounded-[1.8rem] border border-[#f1ddbc] bg-white/80 p-5 backdrop-blur">
                <div className="mb-3 text-xs uppercase tracking-[0.22em] text-[#b96b12]">zone citabile</div>
                <div className="flex flex-wrap gap-2">
                  {speakableSections.slice(0, 6).map((section) => (
                    <span key={section} className="rounded-full border border-[#efcf9a] bg-white px-3 py-1 text-xs text-[#8a4b10]">
                      {section}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-[1.8rem] border border-[#f1ddbc] bg-[linear-gradient(180deg,#fffdfa,#fff5e6)] p-5">
              <div className="mb-3 text-[11px] uppercase tracking-[0.22em] text-[#b96b12]">ce faci mai departe</div>
              <div className="space-y-3 text-sm leading-7 text-[#7c4810]">
                <div>1. Pastreaza semnificatia centrala care ti se potriveste acum.</div>
                <div>2. Continua cu o secventa sau un ghid mai specific intentiei tale.</div>
                <div>3. Aboneaza-te pentru alte interpretari cu valoare practica.</div>
              </div>
              {backToCategoryHref && (
                <Link href={backToCategoryHref} className="mt-4 inline-flex text-sm font-medium text-[#c26c12] hover:text-[#8a4b10]">
                  Vezi mai multe din categorie
                </Link>
              )}
            </div>

            <MonetizationDisclosure hasAffiliate={affiliateProducts.length > 0} hasAds={canRenderAds} />
          </aside>
        </div>

        <div className="mt-12">
          <RecommendedProducts products={affiliateProducts} pagePath={pagePath} templateType="article" title="Recomandari utile dupa acest ghid" />
        </div>

        <div className="mt-12">
          <NewsletterCta
            sourcePath={pagePath}
            variantStyle="angelic"
            title="Primeste noi interpretari pentru numerele si semnele care revin"
            subtitle="Trimitem ghiduri noi pentru iubire, twin flame, manifestare si secvente numerice cu intentie mare."
          />
        </div>

        {canRenderAds && (
          <div className="mt-10">
            <AdSlot config={adsConfig} route="article" slotKey="footer" pagePath={pagePath} />
          </div>
        )}

        {relatedPosts.length > 0 && (
          <section className="mt-16">
            <div className="mb-5 text-xs uppercase tracking-[0.22em] text-[#b96b12]">continua explorarea</div>
            <h2 className="font-serif text-3xl text-[#4c2d12]">{relatedTitle}</h2>
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
              {relatedPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/${post.category?.slug || ''}/${post.slug}`}
                  className="border-t border-[#f0dbc0] pt-4 transition-colors hover:border-[#efbf71]"
                >
                  <div className="mb-1 text-sm text-[#b2721e]">{post.category?.name || 'Ghid'}</div>
                  <div className="font-semibold text-[#5b3411]">{post.title}</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {backToCategoryHref && (
          <div className="mt-10">
            <Link href={backToCategoryHref} className="font-medium text-[#c26c12] hover:text-[#8a4b10]">
              Inapoi la categorie
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
