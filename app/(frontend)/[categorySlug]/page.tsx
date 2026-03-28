import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { buildMetadata } from '@/lib/frontend/metadata'
import { generateSchema } from '@/lib/seo/schema-generator'
import { AdSlot } from '@/components/ads/AdSlot'
import { NewsletterCta } from '@/components/frontend/NewsletterCta'
import { mergeAdsConfig } from '@/lib/ads/config'
import { getFrontendTemplatePack } from '@/lib/sites/frontend-registry'
import { getCurrentSiteBranding, resolveCurrentSite } from '@/lib/sites/resolver'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: { categorySlug: string } }): Promise<Metadata> {
  const [branding, siteContext] = await Promise.all([
    getCurrentSiteBranding(),
    resolveCurrentSite(),
  ])

  const category = await prisma.category.findFirst({
    where: {
      slug: params.categorySlug,
      ...(siteContext.site.id ? { siteId: siteContext.site.id } : {}),
    },
  })

  return buildMetadata({
    siteUrl: branding.siteUrl,
    siteName: branding.siteName,
    title: category?.metaTitle || category?.name || 'Categorie',
    description: category?.metaDesc || category?.description || 'Articole din categorie',
    canonical: `${branding.siteUrl.replace(/\/$/, '')}/${params.categorySlug}`,
  })
}

export default async function CategoryPage({ params, searchParams }: { params: { categorySlug: string }; searchParams: { page?: string } }) {
  const siteContext = await resolveCurrentSite()
  const branding = await getCurrentSiteBranding()
  const frontendTemplate = getFrontendTemplatePack(branding.sitePack.key)
  const dreamy = frontendTemplate.homepageVariant === 'dreamy'
  const page = Math.max(1, parseInt(searchParams.page || '1', 10))
  const pageSize = 12
  const skip = (page - 1) * pageSize

  const category = await prisma.category.findFirst({
    where: {
      slug: params.categorySlug,
      ...(siteContext.site.id ? { siteId: siteContext.site.id } : {}),
    },
  })

  if (!category) return notFound()

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: {
        siteId: category.siteId,
        categoryId: category.id,
        status: 'PUBLISHED',
      },
      orderBy: { publishedAt: 'desc' },
      skip,
      take: pageSize,
      include: { category: { select: { slug: true, name: true } } },
    }),
    prisma.post.count({ where: { siteId: category.siteId, categoryId: category.id, status: 'PUBLISHED' } }),
  ])

  const adsConfig = mergeAdsConfig(branding.seoSettings?.adsConfig || branding.adsConfig)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const featuredPost = posts[0] || null
  const supportingPosts = featuredPost ? posts.slice(1) : posts

  const schema = generateSchema(
    {
      postType: 'ARTICLE',
      title: category.name,
      slug: category.slug,
      contentJson: {},
      contentHtml: '',
      metaTitle: category.metaTitle,
      metaDescription: category.metaDesc,
    },
    { siteName: branding.siteName, siteUrl: branding.siteUrl },
    null,
  )

  if (!dreamy) {
    return (
      <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#fff4de_0%,_#fff9ef_42%,_#fffdf9_100%)] text-[#4c2d12]">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

        <section className="relative isolate overflow-hidden border-b border-[#f3dec1]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.16),_transparent_30%),radial-gradient(circle_at_82%_18%,_rgba(255,244,214,0.96),_transparent_24%),linear-gradient(180deg,#fff8eb_0%,#fffaf3_62%,#fffdf8_100%)]" />
          <div className="relative mx-auto max-w-6xl px-6 py-14 md:py-18">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.55fr)] lg:items-end">
              <div>
                <div className="mb-4 inline-flex rounded-full border border-[#f1d8ae] bg-white/90 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[#b96b12] backdrop-blur">
                  tema spirituala
                </div>
                <h1 className="max-w-3xl font-serif text-5xl leading-[0.95] text-[#4c2d12] md:text-7xl">{category.name}</h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-[#7c4810] md:text-lg">
                  {category.description || `Ghiduri si interpretari din ${category.name}, scrise pentru raspuns rapid, claritate emotionala si pasul urmator practic.`}
                </p>
              </div>

              <aside className="rounded-[2rem] border border-[#f1ddbc] bg-white/80 p-6 shadow-[0_24px_70px_rgba(191,118,28,0.08)] backdrop-blur">
                <div className="text-xs uppercase tracking-[0.24em] text-[#b96b12]">In aceasta tema</div>
                <div className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                  <div>
                    <div className="text-3xl font-semibold text-[#5b3411]">{total}</div>
                    <div className="text-sm text-[#9a5a15]">ghiduri publicate</div>
                  </div>
                  <div>
                    <div className="text-3xl font-semibold text-[#5b3411]">{page}</div>
                    <div className="text-sm text-[#9a5a15]">pagina curenta din {totalPages}</div>
                  </div>
                  <div>
                    <div className="text-3xl font-semibold text-[#5b3411]">{featuredPost ? '1' : '0'}</div>
                    <div className="text-sm text-[#9a5a15]">ghid recomandat azi</div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-6 py-8">
          <AdSlot config={adsConfig} route="category" slotKey="header" pagePath={`/${category.slug}`} />
        </div>

        <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-16 lg:grid-cols-[minmax(0,0.95fr)_minmax(280px,0.34fr)]">
          <div>
            {featuredPost && (
              <Link href={`/${category.slug}/${featuredPost.slug}`} className="block border-b border-[#f0dbc0] pb-8 transition-colors hover:border-[#efbf71]">
                <div className="mb-3 text-xs uppercase tracking-[0.22em] text-[#b2721e]">ghid principal</div>
                <h2 className="max-w-3xl font-serif text-3xl leading-tight text-[#4c2d12] md:text-5xl">{featuredPost.title}</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#7c4810]">
                  {featuredPost.excerpt || 'Primul pas bun pentru aceasta tema: un ghid construit pentru intentie mare, scanare rapida si aprofundare fireasca.'}
                </p>
                <div className="mt-5 text-sm font-medium text-[#c26c12]">Deschide ghidul</div>
              </Link>
            )}

            <div className="mt-8 grid gap-6">
              {supportingPosts.map((post, index) => (
                <Link
                  key={post.id}
                  href={`/${category.slug}/${post.slug}`}
                  className="group grid gap-4 border-t border-[#f0dbc0] py-5 md:grid-cols-[110px_minmax(0,1fr)]"
                >
                  <div className="text-xs uppercase tracking-[0.22em] text-[#b2721e]">
                    #{String(index + 2).padStart(2, '0')}
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-[#5b3411] transition-colors duration-300 group-hover:text-[#8a4b10]">{post.title}</h3>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-[#7c4810]">
                      {post.excerpt || 'Un ghid complementar care continua tema cu explicatii clare si un pas urmator usor de urmat.'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-10">
              <AdSlot config={adsConfig} route="category" slotKey="inContent1" pagePath={`/${category.slug}`} />
            </div>

            <div className="mt-12 flex flex-wrap gap-3">
              {page > 1 && (
                <Link href={`/${category.slug}?page=${page - 1}`} className="rounded-full border border-[#efcf9a] bg-white px-5 py-3 text-sm font-medium text-[#8a4b10] transition-colors hover:border-[#f59e0b] hover:text-[#5b3411]">
                  Pagina anterioara
                </Link>
              )}
              {page < totalPages && (
                <Link href={`/${category.slug}?page=${page + 1}`} className="rounded-full bg-[linear-gradient(135deg,#f59e0b,#f97316)] px-5 py-3 text-sm font-medium text-white transition-colors hover:opacity-95">
                  Pagina urmatoare
                </Link>
              )}
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-[1.9rem] border border-[#f1ddbc] bg-white/80 p-6 backdrop-blur">
              <div className="mb-3 text-xs uppercase tracking-[0.24em] text-[#b96b12]">Cum folosesti aceasta tema</div>
              <p className="text-sm leading-7 text-[#7c4810]">
                Incepe cu ghidul principal, apoi continua cu subiectele suport. Traseul este gandit pentru cautari precise precum iubire, twin flame, bani sau manifestare.
              </p>
            </div>

            <div className="rounded-[1.9rem] border border-[#f1ddbc] bg-white/80 p-6 backdrop-blur">
              <div className="mb-3 text-xs uppercase tracking-[0.24em] text-[#b96b12]">Traseu recomandat</div>
              <div className="space-y-3 text-sm text-[#7c4810]">
                <div>1. Citeste ghidul principal al categoriei.</div>
                <div>2. Continua cu o pagina mai specifica intentiei tale.</div>
                <div>3. Aboneaza-te pentru urmatoarele interpretari relevante.</div>
              </div>
            </div>

            <AdSlot config={adsConfig} route="category" slotKey="footer" pagePath={`/${category.slug}`} />

            <NewsletterCta
              sourcePath={`/${category.slug}`}
              variantStyle="angelic"
              title={`Primeste ghiduri noi din ${category.name}`}
              subtitle="Trimitem interpretari noi pentru secvente numerice, iubire, twin flame si alte teme cu intentie mare."
            />
          </aside>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#f7f0ff_0%,_#fefdf8_34%,_#fcf8f2_100%)] text-[#2c2240]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className="relative isolate overflow-hidden border-b border-[#ede4fa]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(124,92,179,0.16),_transparent_34%),radial-gradient(circle_at_80%_15%,_rgba(255,233,244,0.9),_transparent_28%),linear-gradient(180deg,#f8f2ff_0%,#fefcf8_68%,#fefdf8_100%)]" />
        <div className="relative mx-auto max-w-6xl px-6 py-14 md:py-20">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(260px,0.55fr)] lg:items-end">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-[#ddd0f3] bg-white/80 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[#7b67a5] backdrop-blur">
                categorie editoriala
              </div>
              <h1 className="max-w-3xl font-serif text-5xl leading-[0.95] text-[#2f2050] md:text-7xl">{category.name}</h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[#5f4b80] md:text-lg">
                {category.description || `Lecturi selectate din ${category.name}, gandite pentru sesiuni calme, aprofundare si reveniri naturale la simbolurile care conteaza.`}
              </p>
            </div>

            <aside className="rounded-[2rem] border border-[#e5d9f7] bg-white/76 p-6 shadow-[0_24px_70px_rgba(88,59,136,0.08)] backdrop-blur">
              <div className="text-xs uppercase tracking-[0.24em] text-[#8a74aa]">Din aceasta tema</div>
              <div className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                <div>
                  <div className="text-3xl font-semibold text-[#2f2050]">{total}</div>
                  <div className="text-sm text-[#6a5a93]">articole publicate</div>
                </div>
                <div>
                  <div className="text-3xl font-semibold text-[#2f2050]">{page}</div>
                  <div className="text-sm text-[#6a5a93]">pagina curenta din {totalPages}</div>
                </div>
                <div>
                  <div className="text-3xl font-semibold text-[#2f2050]">{featuredPost ? '1' : '0'}</div>
                  <div className="text-sm text-[#6a5a93]">lectura recomandata azi</div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <AdSlot config={adsConfig} route="category" slotKey="header" pagePath={`/${category.slug}`} />
      </div>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-16 lg:grid-cols-[minmax(0,0.95fr)_minmax(280px,0.34fr)]">
        <div>
          {featuredPost && (
            <Link href={`/${category.slug}/${featuredPost.slug}`} className="block border-b border-[#e9ddf8] pb-8 transition-colors hover:border-[#c9b5ea]">
              <div className="mb-3 text-xs uppercase tracking-[0.22em] text-[#9079ad]">Lectura principala</div>
              <h2 className="max-w-3xl font-serif text-3xl leading-tight text-[#2f2050] md:text-5xl">{featuredPost.title}</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5f4b80]">
                {featuredPost.excerpt || 'Un articol de pornire pentru aceasta categorie, cu ritm editorial calm si spatiu pentru aprofundare.'}
              </p>
              <div className="mt-5 text-sm font-medium text-[#4f35a1]">Deschide articolul</div>
            </Link>
          )}

          <div className="mt-8 grid gap-6">
            {supportingPosts.map((post, index) => (
              <Link
                key={post.id}
                href={`/${category.slug}/${post.slug}`}
                className="group grid gap-4 border-t border-[#e9ddf8] py-5 md:grid-cols-[110px_minmax(0,1fr)]"
              >
                <div className="text-xs uppercase tracking-[0.22em] text-[#9079ad]">
                  #{String(index + 2).padStart(2, '0')}
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-[#34255b] transition-colors duration-300 group-hover:text-[#24183d]">{post.title}</h3>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5f4b80]">
                    {post.excerpt || 'Continuarea fireasca a acestei teme, intr-o pagina construita pentru scanare rapida si lectura lunga.'}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10">
            <AdSlot config={adsConfig} route="category" slotKey="inContent1" pagePath={`/${category.slug}`} />
          </div>

          <div className="mt-12 flex flex-wrap gap-3">
            {page > 1 && (
              <Link href={`/${category.slug}?page=${page - 1}`} className="rounded-full border border-[#ddd0f3] bg-white px-5 py-3 text-sm font-medium text-[#4d3b74] transition-colors hover:border-[#bea8e8] hover:text-[#34255b]">
                Pagina anterioara
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/${category.slug}?page=${page + 1}`} className="rounded-full bg-[#2f2050] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#24183d]">
                Pagina urmatoare
              </Link>
            )}
          </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[1.9rem] border border-[#e7def5] bg-white/80 p-6 backdrop-blur">
            <div className="mb-3 text-xs uppercase tracking-[0.24em] text-[#8a74aa]">Cum citesti aceasta categorie</div>
            <p className="text-sm leading-7 text-[#5f4b80]">
              Incepe cu lectura principala, apoi continua cu textele suport. Structura lasa loc pentru raspuns rapid, ads discrete si explorare fireasca catre alte pagini.
            </p>
          </div>

          <div className="rounded-[1.9rem] border border-[#e7def5] bg-white/80 p-6 backdrop-blur">
            <div className="mb-3 text-xs uppercase tracking-[0.24em] text-[#8a74aa]">Traseu recomandat</div>
            <div className="space-y-3 text-sm text-[#5f4b80]">
              <div>1. Citeste articolul principal din categorie</div>
              <div>2. Deschide un simbol asociat din dictionar</div>
              <div>3. Revino pentru o lectura complementara</div>
            </div>
          </div>

          <AdSlot config={adsConfig} route="category" slotKey="footer" pagePath={`/${category.slug}`} />

          <NewsletterCta
            sourcePath={`/${category.slug}`}
            variantStyle="dreamy"
            title={`Primeste noi lecturi din ${category.name}`}
            subtitle="Trimitem articole noi, teme recurente si recomandari de lectura pas cu pas, in acelasi ton calm si clar."
          />
        </aside>
      </section>
    </main>
  )
}
