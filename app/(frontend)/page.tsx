/* eslint-disable @typescript-eslint/no-explicit-any */
import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { generateSchema } from '@/lib/seo/schema-generator'
import { buildMetadata } from '@/lib/frontend/metadata'
import type { Metadata } from 'next'
import { AdSlot } from '@/components/ads/AdSlot'
import { NewsletterCta } from '@/components/frontend/NewsletterCta'
import { getFrontendTemplatePack } from '@/lib/sites/frontend-registry'
import { getCurrentSiteBranding, resolveCurrentSite } from '@/lib/sites/resolver'

export const revalidate = 1800

export async function generateMetadata(): Promise<Metadata> {
  const { siteName, siteUrl, seoSettings } = await getCurrentSiteBranding()

  return buildMetadata({
    siteUrl,
    siteName,
    title: seoSettings?.defaultMetaTitle || 'Interpretari vise si dictionar simboluri',
    description: seoSettings?.defaultMetaDesc || 'Ultimele interpretari de vise si simboluri onirice explicate.',
    canonical: siteUrl,
  })
}

export default async function HomePage() {
  const [branding, siteContext] = await Promise.all([
    getCurrentSiteBranding(),
    resolveCurrentSite(),
  ])
  const { siteName, siteUrl, adsConfig, dictionaryPath } = branding
  const homepageSections = siteContext.site.homepageSections || siteContext.sitePack.homepage.sections
  const sectionMap = new Map<string, any>(homepageSections.map((section: any) => [section.key, section]))
  const siteWhere = siteContext.site.id ? { siteId: siteContext.site.id } : undefined
  const frontendTemplate = getFrontendTemplatePack(branding.sitePack.key)
  const dreamy = frontendTemplate.homepageVariant === 'dreamy'
  const heroEnabled = sectionMap.get('hero')?.enabled !== false
  const newsletterEnabled = sectionMap.get('newsletter')?.enabled !== false

  const postsLimit = sectionMap.get('latestPosts')?.enabled === false ? 0 : sectionMap.get('latestPosts')?.limit || 6
  const categoriesLimit = sectionMap.get('categories')?.enabled === false ? 0 : sectionMap.get('categories')?.limit || 8
  const symbolsLimit = sectionMap.get('featuredSymbols')?.enabled === false ? 0 : sectionMap.get('featuredSymbols')?.limit || 6

  let posts: any[] = []
  let categories: any[] = []
  let symbols: any[] = []
  const mediaMap = new Map<string, { id: string; url: string; width: number | null; height: number | null; altText: string | null }>()

  try {
    const queries: Promise<unknown>[] = []

    if (postsLimit > 0) {
      queries.push(
        prisma.post.findMany({
          where: { ...siteWhere, status: 'PUBLISHED' },
          take: postsLimit,
          orderBy: { publishedAt: 'desc' },
          include: { category: { select: { slug: true, name: true } } },
        }),
      )
    }

    if (categoriesLimit > 0) {
      queries.push(prisma.category.findMany({ where: siteWhere, orderBy: { sortOrder: 'asc' }, take: categoriesLimit }))
    }

    if (symbolsLimit > 0) {
      queries.push(
        prisma.symbolEntry.findMany({ where: siteWhere, orderBy: { createdAt: 'desc' }, take: symbolsLimit }),
      )
    }

    const results = await Promise.all(queries)
    let index = 0

    if (postsLimit > 0) posts = (results[index++] as any[]) || []
    if (categoriesLimit > 0) categories = (results[index++] as any[]) || []
    if (symbolsLimit > 0) symbols = (results[index++] as any[]) || []

    const featuredImageIds = posts
      .map((post) => post.featuredImageId)
      .filter((value): value is string => Boolean(value))

    if (featuredImageIds.length > 0) {
      const media = await prisma.media.findMany({
        where: { id: { in: featuredImageIds } },
        select: { id: true, url: true, width: true, height: true, altText: true },
      })
      media.forEach((item) => {
        mediaMap.set(item.id, item)
      })
    }
  } catch {
    // fallback during build when db is unavailable
  }

  const schema = generateSchema(
    {
      postType: 'ARTICLE',
      title: 'Homepage',
      slug: '',
      contentJson: {},
      contentHtml: '',
    },
    { siteName, siteUrl },
    null,
  )

  const heroPost = posts.find((post) => post.featuredImageId) || posts[0] || null
  const heroImage = heroPost?.featuredImageId ? mediaMap.get(heroPost.featuredImageId) : null
  const supportingPosts = posts.filter((post) => post.id !== heroPost?.id).slice(0, 3)
  const featuredTopics = categories.slice(0, 6)
  const featuredSymbols = symbols.slice(0, 4)

  if (!dreamy) {
    return (
      <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#fff4de_0%,_#fff9ef_42%,_#fffdf9_100%)] text-[#4c2d12]">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

        {heroEnabled && (
          <section className="relative isolate overflow-hidden border-b border-[#f3dec1]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_30%),radial-gradient(circle_at_82%_18%,_rgba(255,244,214,0.96),_transparent_24%),linear-gradient(180deg,#fff8eb_0%,#fffaf3_62%,#fffdf8_100%)]" />
            <div className="absolute right-[-6rem] top-12 h-64 w-64 rounded-full bg-[#ffd79c]/55 blur-3xl" />
            <div className="absolute left-[-6rem] top-24 h-56 w-56 rounded-full bg-[#ffe7bf]/70 blur-3xl" />

            <div className="relative mx-auto grid min-h-[calc(100svh-96px)] max-w-[1400px] gap-10 px-0 pb-12 pt-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.78fr)] lg:items-stretch">
              <div className="flex min-h-[520px] flex-col justify-end px-6 pb-8 pt-10 md:px-10 lg:px-14 lg:pb-14">
                <div className="homepage-reveal-up mb-4 inline-flex w-fit rounded-full border border-[#f1d8ae] bg-white/90 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-[#b96b12] backdrop-blur">
                  numar angelic
                </div>
                <p className="homepage-reveal-up mb-4 max-w-md text-sm uppercase tracking-[0.22em] text-[#b2721e] [animation-delay:120ms]">
                  ghid spiritual pentru secvente numerice
                </p>
                <h1 className="homepage-reveal-up max-w-3xl text-balance font-serif text-5xl leading-[0.95] text-[#4c2d12] [animation-delay:220ms] md:text-7xl">
                  Cand vezi aceeasi secventa numerica iar si iar, incepe cu un raspuns clar, cald si usor de urmat.
                </h1>
                <p className="homepage-reveal-up mt-6 max-w-xl text-base leading-7 text-[#7c4810] [animation-delay:320ms] md:text-lg">
                  Interpretari pentru 111, 222, 333 si alte numere angelice, explicate pentru iubire, twin flame, cariera, bani si sincronicitati de zi cu zi.
                </p>
                <div className="homepage-reveal-up mt-8 flex flex-wrap gap-3 [animation-delay:420ms]">
                  <Link href={heroPost?.category?.slug && heroPost?.slug ? `/${heroPost.category.slug}/${heroPost.slug}` : (featuredTopics[0] ? `/${featuredTopics[0].slug}` : '/cauta')} className="rounded-full bg-[linear-gradient(135deg,#f59e0b,#f97316)] px-6 py-3 text-sm font-medium text-white transition-transform duration-300 hover:-translate-y-0.5">
                    {heroPost ? 'Citeste ghidul principal' : 'Incepe cu un ghid popular'}
                  </Link>
                  <Link href="/cauta" className="rounded-full border border-[#f1d8ae] bg-white/90 px-6 py-3 text-sm font-medium text-[#8a4b10] transition-colors duration-300 hover:border-[#f59e0b] hover:text-[#5b3411]">
                    Cauta un numar sau o tema
                  </Link>
                </div>
                <div className="homepage-reveal-up mt-10 flex flex-wrap gap-6 text-sm text-[#9a5a15] [animation-delay:520ms]">
                  <span>111, 222, 333 explicate simplu</span>
                  <span>Love, twin flame, cariera, bani</span>
                  <span>Ritual editorial pentru trafic organic rece</span>
                </div>
              </div>

              <div className="relative flex min-h-[520px] items-end px-6 md:px-10 lg:px-0">
                <div className="homepage-float relative w-full overflow-hidden rounded-[2.6rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(255,243,218,0.78))] shadow-[0_35px_120px_rgba(191,118,28,0.16)]">
                  {heroImage?.url ? (
                    <>
                      <div className="absolute inset-0">
                        <Image
                          src={heroImage.url}
                          alt={heroImage.altText || heroPost?.title || siteName}
                          fill
                          priority
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(73,41,9,0.08),rgba(76,43,13,0.52)_76%,rgba(71,39,10,0.78)_100%)]" />
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),rgba(255,239,211,0.88)_42%,rgba(192,116,29,0.92)_100%)]" />
                  )}

                  <div className="relative flex min-h-[560px] flex-col justify-between p-8 md:p-10">
                    <div className="self-end rounded-full border border-white/40 bg-white/12 px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-white backdrop-blur">
                      secventa recomandata
                    </div>

                    <div className="max-w-md">
                      <p className="mb-3 text-xs uppercase tracking-[0.25em] text-white/85">
                        {heroPost?.category?.name || 'ghid principal'}
                      </p>
                      <h2 className="text-3xl font-semibold leading-tight text-white md:text-4xl">
                        {heroPost?.title || 'Numere angelice si semnificatii spirituale explicate clar, fara zgomot inutil.'}
                      </h2>
                      <p className="mt-4 max-w-sm text-sm leading-6 text-white/80">
                        {heroPost?.excerpt || 'Intri repede in semnificatie, apoi continui in ghiduri construite pentru cautari cu intentie mare si recirculare organica.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="mx-auto max-w-6xl px-6 pb-10">
          <AdSlot config={adsConfig} route="homepage" slotKey="header" pagePath="/" />
        </div>

        <section className="mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <div>
            <div className="mb-5 text-xs uppercase tracking-[0.25em] text-[#b96b12]">Cum intri in site</div>
            <h2 className="max-w-2xl font-serif text-3xl leading-tight text-[#4c2d12] md:text-5xl">
              Gandit pentru raspunsuri rapide, apoi pentru aprofundare spirituala pe teme reale de viata.
            </h2>
          </div>
          <div className="border-l border-[#f0dbc0] pl-0 text-sm leading-7 text-[#7c4810] lg:pl-8">
            Pentru vizitatoarele care vin din Google, traseul trebuie sa fie instant: vezi semnificatia, intelegi contextul, apoi mergi natural spre iubire, twin flame, cariera sau alte secvente inrudite.
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-8 px-6 pb-16 lg:grid-cols-3">
          {[
            {
              title: 'Secvente populare',
              text: '111, 222, 333, 444, 555 si alte numere cautate frecvent, explicate intr-un limbaj clar si cald.',
            },
            {
              title: 'Intenturi cu valoare mare',
              text: 'Iubire, twin flame, relatii, bani, manifestare si cariera, structurate ca hub-uri si ghiduri suport.',
            },
            {
              title: 'Layout gandit pentru monetizare',
              text: 'Spatii naturale pentru ads si recomandari practice, fara sa fractureze increderea sau fluxul lecturii.',
            },
          ].map((item, index) => (
            <div key={item.title} className="homepage-reveal-up border-t border-[#f0dbc0] pt-5 text-[#6b3f15]" style={{ animationDelay: `${index * 120}ms` }}>
              <h3 className="text-xl font-semibold text-[#5b3411]">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#7c4810]">{item.text}</p>
            </div>
          ))}
        </section>

        {supportingPosts.length > 0 && (
          <section className="mx-auto max-w-6xl px-6 pb-16">
            <div className="mb-8 flex items-end justify-between gap-6">
              <div>
                <div className="mb-3 text-xs uppercase tracking-[0.25em] text-[#b96b12]">Ghiduri pentru intentie mare</div>
                <h2 className="font-serif text-3xl text-[#4c2d12] md:text-5xl">Pagini construite pentru cautari precise si reveniri naturale.</h2>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <div className="grid gap-5">
                {supportingPosts.slice(0, 2).map((post, index) => (
                  <Link key={post.id} href={`/${post.category?.slug || ''}/${post.slug}`} className="homepage-reveal-up group grid gap-4 border-t border-[#f0dbc0] py-5 md:grid-cols-[120px_minmax(0,1fr)]" style={{ animationDelay: `${140 + index * 120}ms` }}>
                    <div className="text-xs uppercase tracking-[0.22em] text-[#b2721e]">
                      {post.category?.name || 'Ghid'}
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-[#5b3411] transition-colors duration-300 group-hover:text-[#8a4b10]">
                        {post.title}
                      </h3>
                      <p className="mt-3 max-w-xl text-sm leading-7 text-[#7c4810]">{post.excerpt || 'Un ghid creat pentru cititoare care cauta confirmare, context si un pas urmator clar.'}</p>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="rounded-[2rem] border border-[#f1ddbc] bg-white/75 p-6 backdrop-blur">
                <div className="text-xs uppercase tracking-[0.25em] text-[#b96b12]">Teme principale</div>
                <div className="mt-5 flex flex-wrap gap-3">
                  {featuredTopics.map((category) => (
                    <Link key={category.id} href={`/${category.slug}`} className="rounded-full border border-[#efcf9a] bg-white px-4 py-2 text-sm text-[#8a4b10] transition-colors duration-300 hover:border-[#f59e0b] hover:text-[#5b3411]">
                      {category.name}
                    </Link>
                  ))}
                </div>

                <div className="mt-8">
                  <AdSlot config={adsConfig} route="homepage" slotKey="inContent1" pagePath="/" />
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="mx-auto max-w-6xl px-6 pb-12">
          <div className="rounded-[2rem] border border-[#f1ddbc] bg-[linear-gradient(180deg,#fffdf9,#fff5e5)] p-6 backdrop-blur md:p-8">
            <div className="mb-5 text-xs uppercase tracking-[0.25em] text-[#b96b12]">Secvente populare acum</div>
            <div className="flex flex-wrap gap-3">
              {['111', '222', '333', '444', '555', '777', '888', '999', '1111'].map((item) => (
                <Link key={item} href="/cauta" className="rounded-full border border-[#efcf9a] bg-white px-4 py-2 text-sm font-medium text-[#8a4b10] transition-colors hover:border-[#f59e0b] hover:text-[#5b3411]">
                  {item}
                </Link>
              ))}
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="text-sm leading-7 text-[#7c4810]">
                Pentru `numarangelic`, homepage-ul trebuie sa aduca imediat cele mai cautate secvente si hub-urile cu cea mai mare valoare comerciala: iubire, twin flame, manifestare si bani.
              </div>
              <div className="text-sm leading-7 text-[#7c4810]">
                Modelul ideal este: hero -&gt; ghid principal -&gt; teme principale -&gt; secvente populare -&gt; newsletter. Asa obtinem mai multe clickuri interne si un CTR mai bun pe placement-urile native.
              </div>
            </div>
            <div className="mt-8">
              <AdSlot config={adsConfig} route="homepage" slotKey="inContent2" pagePath="/" />
            </div>
          </div>
        </section>

        {newsletterEnabled && (
          <section className="mx-auto max-w-6xl px-6 pb-20">
            <NewsletterCta
              sourcePath="/"
              variantStyle="angelic"
              title="Primeste noi interpretari pentru numerele pe care le vezi cel mai des"
              subtitle="Trimitem ghiduri noi pentru secvente numerice, iubire, twin flame si mesaje spirituale cu intentie mare."
            />
            <div className="mt-8">
              <AdSlot config={adsConfig} route="homepage" slotKey="footer" pagePath="/" />
            </div>
          </section>
        )}
      </main>
    )
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#fbf7ff] text-[#241b38]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      {heroEnabled && (
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(119,75,166,0.18),_transparent_34%),radial-gradient(circle_at_75%_20%,_rgba(255,232,244,0.95),_transparent_30%),linear-gradient(180deg,#f5efff_0%,#fdfaf6_58%,#fbf7ff_100%)]" />
        <div className="absolute left-[-9rem] top-20 h-72 w-72 rounded-full bg-[#ead8ff]/60 blur-3xl" />
        <div className="absolute right-[-5rem] top-10 h-64 w-64 rounded-full bg-[#ffe8f3]/70 blur-3xl" />

        <div className="relative mx-auto grid min-h-[calc(100svh-96px)] max-w-[1400px] gap-10 px-0 pb-12 pt-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,0.78fr)] lg:items-stretch">
          <div className="flex min-h-[520px] flex-col justify-end px-6 pb-8 pt-10 md:px-10 lg:px-14 lg:pb-14">
            <div className="homepage-reveal-up mb-4 inline-flex w-fit rounded-full border border-[#dccccf] bg-white/80 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-[#7e61ab] backdrop-blur">
              cand visam
            </div>
            <p className="homepage-reveal-up mb-4 max-w-md text-sm uppercase tracking-[0.22em] text-[#8c739f] [animation-delay:120ms]">
              ritual editorial pentru interpretarea viselor
            </p>
            <h1 className="homepage-reveal-up max-w-3xl text-balance font-serif text-5xl leading-[0.95] text-[#2d2148] [animation-delay:220ms] md:text-7xl">
              Un loc calm pentru femeile care cauta sens, simboluri si liniste dupa un vis puternic.
            </h1>
            <p className="homepage-reveal-up mt-6 max-w-xl text-base leading-7 text-[#5f4b80] [animation-delay:320ms] md:text-lg">
              Interpretari clare, dictionar de simboluri si ghiduri care leaga intuitia, contextul emotional si semnele recurente intr-o experienta premium, usor de parcurs.
            </p>
            <div className="homepage-reveal-up mt-8 flex flex-wrap gap-3 [animation-delay:420ms]">
              <Link href={heroPost?.category?.slug && heroPost?.slug ? `/${heroPost.category.slug}/${heroPost.slug}` : '/dictionar'} className="rounded-full bg-[#2f2050] px-6 py-3 text-sm font-medium text-white transition-transform duration-300 hover:-translate-y-0.5 hover:bg-[#24183d]">
                {heroPost ? 'Citeste ghidul recomandat' : 'Incepe cu dictionarul'}
              </Link>
              {dictionaryPath && (
                <Link href={dictionaryPath} className="rounded-full border border-[#dccccf] bg-white/80 px-6 py-3 text-sm font-medium text-[#4d3b74] transition-colors duration-300 hover:border-[#bca4e8] hover:text-[#34255b]">
                  Exploreaza simbolurile A-Z
                </Link>
              )}
            </div>
            <div className="homepage-reveal-up mt-10 flex flex-wrap gap-6 text-sm text-[#6d5a95] [animation-delay:520ms]">
              <span>Interpretari pe teme feminine</span>
              <span>Simboluri recurente explicate simplu</span>
              <span>Ritm editorial gandit pentru lectura lunga</span>
            </div>
          </div>

          <div className="relative flex min-h-[520px] items-end px-6 md:px-10 lg:px-0">
            <div className="homepage-float relative w-full overflow-hidden rounded-[2.6rem] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(250,244,255,0.72))] shadow-[0_35px_120px_rgba(70,42,120,0.18)]">
              {heroImage?.url ? (
                <>
                  <div className="absolute inset-0">
                    <Image
                      src={heroImage.url}
                      alt={heroImage.altText || heroPost?.title || siteName}
                      fill
                      priority
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(38,24,63,0.06),rgba(34,22,57,0.58)_78%,rgba(28,17,46,0.84)_100%)]" />
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),rgba(241,230,255,0.88)_42%,rgba(76,54,118,0.92)_100%)]" />
              )}

              <div className="relative flex min-h-[560px] flex-col justify-between p-8 md:p-10">
                <div className="self-end rounded-full border border-white/40 bg-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-white backdrop-blur">
                  lectura recomandata
                </div>

                <div className="max-w-md">
                  <p className="mb-3 text-xs uppercase tracking-[0.25em] text-white/80">
                    {heroPost?.category?.name || 'Selectie editoriala'}
                  </p>
                  <h2 className="text-3xl font-semibold leading-tight text-white md:text-4xl">
                    {heroPost?.title || 'Vise, simboluri si intelesuri pentru serile in care cauti un raspuns clar.'}
                  </h2>
                  <p className="mt-4 max-w-sm text-sm leading-6 text-white/80">
                    {heroPost?.excerpt || 'Porneste cu o lectura amplasata intr-un peisaj calm, construit pentru sesiuni lungi si reveniri naturale.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      <div className="mx-auto max-w-6xl px-6 pb-10">
        <AdSlot config={adsConfig} route="homepage" slotKey="header" pagePath="/" />
      </div>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
        <div>
          <div className="mb-5 text-xs uppercase tracking-[0.25em] text-[#8f78ab]">Ce poti explora aici</div>
          <h2 className="max-w-2xl font-serif text-3xl leading-tight text-[#2d2148] md:text-5xl">
            Construit ca o revista spirituala lenta, nu ca un agregator de raspunsuri rapide.
          </h2>
        </div>
        <div className="border-l border-[#e8dcf9] pl-0 text-sm leading-7 text-[#5f4b80] lg:pl-8">
          Descoperirea este gandita pentru femei care citesc intuitiv: prima lectura aduce raspunsul direct, iar restul paginii aprofundeaza simbolurile, starile si conexiunile pe care merita sa le urmaresti.
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-6 pb-16 lg:grid-cols-3">
        {[
          {
            title: 'Interpretari de context',
            text: 'Articole pentru vise despre familie, relatii, anxietate, dor, sarcina, separare sau transformare personala.',
          },
          {
            title: 'Dictionar pentru reveniri rapide',
            text: 'Un index A-Z pentru simbolurile care apar recurent si pentru serile in care vrei raspunsuri fara sa te pierzi in prea multe pagini.',
          },
          {
            title: 'Lectura prietenoasa cu ads',
            text: 'Ritmul paginii lasa respiratie intre sectiuni, astfel incat monetizarea sa existe fara sa rupa atmosfera editoriala.',
          },
        ].map((item, index) => (
          <div
            key={item.title}
            className="homepage-reveal-up border-t border-[#ded0f5] pt-5 text-[#35255a]"
            style={{ animationDelay: `${index * 120}ms` }}
          >
            <h3 className="text-xl font-semibold">{item.title}</h3>
            <p className="mt-3 text-sm leading-7 text-[#5f4b80]">{item.text}</p>
          </div>
        ))}
      </section>

      {supportingPosts.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-16">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <div className="mb-3 text-xs uppercase tracking-[0.25em] text-[#8f78ab]">Lecturi pentru seara asta</div>
              <h2 className="font-serif text-3xl text-[#2d2148] md:text-5xl">Ghiduri care merita deschise dupa primul raspuns.</h2>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="grid gap-5">
              {supportingPosts.slice(0, 2).map((post, index) => (
                <Link
                  key={post.id}
                  href={`/${post.category?.slug || ''}/${post.slug}`}
                  className="homepage-reveal-up group grid gap-4 border-t border-[#e6daf7] py-5 md:grid-cols-[120px_minmax(0,1fr)]"
                  style={{ animationDelay: `${140 + index * 120}ms` }}
                >
                  <div className="text-xs uppercase tracking-[0.22em] text-[#9079ad]">
                    {post.category?.name || 'Articol'}
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-[#34255b] transition-colors duration-300 group-hover:text-[#24183d]">
                      {post.title}
                    </h3>
                    <p className="mt-3 max-w-xl text-sm leading-7 text-[#5f4b80]">{post.excerpt || 'Citeste o interpretare structurata, scrisa pentru lectura lunga si reveniri naturale.'}</p>
                  </div>
                </Link>
              ))}
            </div>

            <div className="rounded-[2rem] border border-[#e6daf7] bg-white/70 p-6 backdrop-blur">
              <div className="text-xs uppercase tracking-[0.25em] text-[#8f78ab]">Teme populare</div>
              <div className="mt-5 flex flex-wrap gap-3">
                {featuredTopics.map((category) => (
                  <Link
                    key={category.id}
                    href={`/${category.slug}`}
                    className="rounded-full border border-[#ddd0f3] bg-white px-4 py-2 text-sm text-[#4d3b74] transition-colors duration-300 hover:border-[#bea8e8] hover:text-[#34255b]"
                  >
                    {category.name}
                  </Link>
                ))}
              </div>

              <div className="mt-8">
                <AdSlot config={adsConfig} route="homepage" slotKey="inContent1" pagePath="/" />
              </div>
            </div>
          </div>
        </section>
      )}

      {dictionaryPath && featuredSymbols.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-16">
          <div className="grid gap-8 rounded-[2.4rem] border border-[#eadff8] bg-[linear-gradient(180deg,#fffdf8,#faf5ff)] p-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:p-10">
            <div>
              <div className="mb-3 text-xs uppercase tracking-[0.25em] text-[#8f78ab]">Dictionar spiritual</div>
              <h2 className="font-serif text-3xl text-[#2d2148] md:text-5xl">
                Incepe cu simbolul care ti-a ramas in minte dimineata.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-[#5f4b80]">
                O intrare calm structurata pentru serpi, apa, copii, case, morti, zbor, mireasa, dinti si alte imagini care revin in visele intense.
              </p>
              <div className="mt-8">
                <Link href={dictionaryPath} className="rounded-full bg-[#2f2050] px-6 py-3 text-sm font-medium text-white transition-transform duration-300 hover:-translate-y-0.5 hover:bg-[#24183d]">
                  Vezi dictionarul complet
                </Link>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {featuredSymbols.map((symbol, index) => (
                <Link
                  key={symbol.id}
                  href={`${dictionaryPath}/${symbol.letter}/${symbol.slug}`}
                  className="homepage-reveal-up border-t border-[#dfd3f3] py-4"
                  style={{ animationDelay: `${80 + index * 90}ms` }}
                >
                  <div className="text-xs uppercase tracking-[0.22em] text-[#9079ad]">Litera {symbol.letter}</div>
                  <div className="mt-2 text-xl font-semibold text-[#34255b]">{symbol.name}</div>
                  <p className="mt-2 text-sm leading-7 text-[#5f4b80]">{symbol.shortDefinition}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-6 pb-12">
        <div className="rounded-[2rem] border border-[#eadff8] bg-white/85 p-6 backdrop-blur md:p-8">
          <div className="mb-5 text-xs uppercase tracking-[0.25em] text-[#8f78ab]">Ritm editorial</div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="text-sm leading-7 text-[#5f4b80]">
              Homepage-ul este gandit pentru scanare rapida, lectura lunga si ads integrate intre momente naturale de pauza. Brandul ramane principal, iar monetizarea se aseaza in spatii respirabile.
            </div>
            <div className="text-sm leading-7 text-[#5f4b80]">
              Pentru vizitatoarele recurente, traseul ideal este: hero -&gt; articol recomandat -&gt; dictionar -&gt; newsletter. Asta creste timpul in site si lasa loc pentru placement-uri curate.
            </div>
          </div>
          <div className="mt-8">
            <AdSlot config={adsConfig} route="homepage" slotKey="inContent2" pagePath="/" />
          </div>
        </div>
      </section>

      {newsletterEnabled && (
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <NewsletterCta
          sourcePath="/"
          variantStyle="dreamy"
          title="Primeste interpretari noi in acelasi ton calm si clar"
          subtitle="Trimitem lecturi noi, simboluri actualizate si ghiduri pentru vise recurente intr-un format usor de parcurs."
        />
        <div className="mt-8">
          <AdSlot config={adsConfig} route="homepage" slotKey="footer" pagePath="/" />
        </div>
      </section>
      )}
    </main>
  )
}







