import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { AdSlot } from '@/components/ads/AdSlot'
import { NewsletterCta } from '@/components/frontend/NewsletterCta'
import { mergeAdsConfig } from '@/lib/ads/config'
import { prisma } from '@/lib/prisma'
import { buildMetadata } from '@/lib/frontend/metadata'
import { getFrontendTemplatePack } from '@/lib/sites/frontend-registry'
import { getCurrentSiteBranding, resolveCurrentSite } from '@/lib/sites/resolver'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: { letter: string } }): Promise<Metadata> {
  const branding = await getCurrentSiteBranding()
  const dictionaryPath = branding.dictionaryPath || '/dictionar'

  return buildMetadata({
    siteUrl: branding.siteUrl,
    siteName: branding.siteName,
    title: `Simboluri cu litera ${params.letter.toUpperCase()}`,
    description: `Toate simbolurile din dictionar pentru litera ${params.letter.toUpperCase()}.`,
    canonical: `${branding.siteUrl.replace(/\/$/, '')}${dictionaryPath}/${params.letter.toUpperCase()}`,
  })
}

export default async function DictionaryLetterPage({ params }: { params: { letter: string } }) {
  const siteContext = await resolveCurrentSite()
  const branding = await getCurrentSiteBranding()
  const dictionaryPath = branding.dictionaryPath || '/dictionar'
  const frontendTemplate = getFrontendTemplatePack(branding.sitePack.key)
  const dreamy = frontendTemplate.dictionaryVariant === 'dreamy'
  const letter = params.letter.toUpperCase()
  if (!/^[A-Z]$/.test(letter)) return notFound()

  const symbols = await prisma.symbolEntry.findMany({
    where: {
      letter,
      publishedAt: { not: null },
      ...(siteContext.site.id ? { siteId: siteContext.site.id } : {}),
    },
    orderBy: { name: 'asc' },
    select: { id: true, slug: true, name: true, shortDefinition: true, letter: true },
  })

  const adsConfig = mergeAdsConfig(siteContext.seoSettings?.adsConfig || branding.adsConfig)
  const siteUrl = branding.siteUrl.replace(/\/$/, '')
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: `Simboluri onirice cu litera ${letter}`,
    url: `${siteUrl}${dictionaryPath}/${letter}`,
    hasDefinedTerm: symbols.map((symbol) => ({
      '@type': 'DefinedTerm',
      name: symbol.name,
      description: symbol.shortDefinition,
      url: `${siteUrl}${dictionaryPath}/${letter}/${symbol.slug}`,
    })),
  }

  if (!dreamy) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#fffaf2,#fff7ea)] text-[#4c2d12]">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        <div className="mx-auto max-w-5xl px-6 py-12">
          <nav className="mb-6 text-sm text-[#9a5a15]">
            <Link href={dictionaryPath}>Dictionar</Link> / {letter}
          </nav>
          <div className="mb-8 rounded-[2rem] border border-[#f2d8ab] bg-[linear-gradient(135deg,#fff9ef,#fff0d7)] p-8">
            <h1 className="mb-3 text-4xl font-semibold text-[#4c2d12]">Simboluri cu litera {letter}</h1>
            <p className="text-[#7c4810]">Toate simbolurile si semnificatiile spirituale indexate la litera {letter}.</p>
          </div>
          <div className="mb-8"><AdSlot config={adsConfig} route="dictionaryIndex" slotKey="header" pagePath={`${dictionaryPath}/${letter}`} /></div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {symbols.map((symbol) => (
              <Link
                key={symbol.id}
                href={`${dictionaryPath}/${letter}/${symbol.slug}`}
                className="rounded-2xl border border-[#f2d8ab] bg-white/95 p-5 hover:border-[#f59e0b]"
              >
                <div className="font-semibold text-[#5b3411]">{symbol.name}</div>
                <p className="mt-2 text-sm text-[#7c4810]">{symbol.shortDefinition}</p>
              </Link>
            ))}
          </div>
          <div className="mt-10">
            <NewsletterCta sourcePath={`${dictionaryPath}/${letter}`} variantStyle="angelic" title={`Primeste simboluri noi cu litera ${letter}`} subtitle="Trimitem simboluri noi si explicatii usor de parcurs, direct pe email." />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#f6efff_0%,_#fefdf8_34%,_#fcf8f2_100%)] text-[#2c2240]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className="relative isolate overflow-hidden border-b border-[#ece3f9]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(123,88,180,0.16),_transparent_33%),radial-gradient(circle_at_82%_18%,_rgba(255,234,244,0.92),_transparent_24%),linear-gradient(180deg,#f7f1ff_0%,#fefcf9_68%,#fefdf8_100%)]" />
        <div className="relative mx-auto max-w-5xl px-6 py-14 md:py-18">
          <nav className="mb-6 text-xs uppercase tracking-[0.18em] text-[#8a74aa]">
            <Link href={dictionaryPath}>Dictionar</Link> / {letter}
          </nav>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(250px,0.5fr)] lg:items-end">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-[#ddd0f3] bg-white/80 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[#7b67a5] backdrop-blur">
                litera {letter}
              </div>
              <h1 className="max-w-3xl font-serif text-5xl leading-[0.95] text-[#2f2050] md:text-6xl">Simbolurile care incep cu {letter}.</h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[#5f4b80] md:text-lg">
                O lista clara, ordonata alfabetic, pentru momentele in care vrei sa ajungi rapid la semnificatia unui simbol care ti-a ramas in minte dupa vis.
              </p>
            </div>

            <aside className="rounded-[2rem] border border-[#e5d9f7] bg-white/76 p-6 shadow-[0_24px_70px_rgba(88,59,136,0.08)] backdrop-blur">
              <div className="text-xs uppercase tracking-[0.24em] text-[#8a74aa]">Pe aceasta litera</div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div>
                  <div className="text-3xl font-semibold text-[#2f2050]">{symbols.length}</div>
                  <div className="text-sm text-[#6a5a93]">simboluri publicate</div>
                </div>
                <div>
                  <div className="text-3xl font-semibold text-[#2f2050]">A-Z</div>
                  <div className="text-sm text-[#6a5a93]">navigare rapida intre litere</div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <AdSlot config={adsConfig} route="dictionaryIndex" slotKey="header" pagePath={`${dictionaryPath}/${letter}`} />
      </div>

      <section className="mx-auto grid max-w-5xl gap-10 px-6 pb-14 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.42fr)]">
        <div>
          <div className="mb-4 text-xs uppercase tracking-[0.24em] text-[#8a74aa]">Lista alfabetica</div>
          <div className="grid gap-4 md:grid-cols-2">
            {symbols.map((symbol, index) => (
              <Link
                key={symbol.id}
                href={`${dictionaryPath}/${letter}/${symbol.slug}`}
                className="group border-t border-[#e6daf7] py-5 transition-colors hover:border-[#c8b3ec]"
              >
                <div className="text-xs uppercase tracking-[0.22em] text-[#9079ad]">#{String(index + 1).padStart(2, '0')}</div>
                <div className="mt-2 text-2xl font-semibold text-[#34255b] transition-colors duration-300 group-hover:text-[#24183d]">{symbol.name}</div>
                <p className="mt-3 text-sm leading-7 text-[#5f4b80]">{symbol.shortDefinition}</p>
              </Link>
            ))}
            {symbols.length === 0 && (
              <div className="rounded-[1.8rem] border border-dashed border-[#d9cbf0] bg-white/60 p-6 text-sm text-[#6f5a92]">
                Nu exista inca simboluri publicate pentru aceasta litera.
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[1.8rem] border border-[#e7def5] bg-white/80 p-5 backdrop-blur">
            <div className="mb-3 text-xs uppercase tracking-[0.22em] text-[#8a74aa]">Cum folosesti pagina</div>
            <div className="space-y-3 text-sm leading-7 text-[#5f4b80]">
              <div>1. Alege simbolul care corespunde cel mai bine imaginii din vis.</div>
              <div>2. Citeste definitia scurta pentru raspunsul imediat.</div>
              <div>3. Continua spre simbolurile inrudite pentru context complet.</div>
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-[#e7def5] bg-[linear-gradient(180deg,#fffdf8,#faf5ff)] p-5">
            <div className="mb-3 text-xs uppercase tracking-[0.22em] text-[#8a74aa]">Navigare rapida</div>
            <Link href={dictionaryPath} className="text-sm font-medium text-[#4f35a1] hover:text-[#35246f]">Inapoi la indexul complet al dictionarului</Link>
          </div>

          <AdSlot config={adsConfig} route="dictionaryIndex" slotKey="inContent1" pagePath={`${dictionaryPath}/${letter}`} />
        </aside>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-16">
        <NewsletterCta sourcePath={`${dictionaryPath}/${letter}`} variantStyle="dreamy" title={`Primeste simboluri noi cu litera ${letter}`} subtitle="Trimitem simboluri noi, definitii clare si recomandari de lectura din dictionar." />
      </section>

      <div className="mx-auto max-w-5xl px-6 pb-14">
        <AdSlot config={adsConfig} route="dictionaryIndex" slotKey="footer" pagePath={`${dictionaryPath}/${letter}`} />
      </div>
    </main>
  )
}
