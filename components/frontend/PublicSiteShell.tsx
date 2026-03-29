import Link from 'next/link'
import type { ReactNode } from 'react'
import { SearchForm } from '@/components/frontend/SearchForm'
import type { FrontendShellVariant } from '@/lib/sites/frontend-registry'
import type { SiteFooterLink } from '@/lib/sites/types'

type CategoryLink = {
  id: string
  name: string
  slug: string
}

type PublicSiteShellProps = {
  children: ReactNode
  categories: CategoryLink[]
  siteName: string
  logoText: string
  headerTagline: string
  footerDescription: string
  footerLinks: SiteFooterLink[]
  searchPath: string
  dictionaryPath?: string | null
  dictionaryLabel?: string
  searchLabel?: string
  variant?: FrontendShellVariant
}

export function PublicSiteShell({
  children,
  categories,
  siteName,
  logoText,
  headerTagline,
  footerDescription,
  footerLinks,
  searchPath,
  dictionaryPath,
  dictionaryLabel = 'Dictionar A-Z',
  searchLabel = 'Cauta in site',
  variant = 'dreamy',
}: PublicSiteShellProps) {
  const dreamy = variant === 'dreamy'

  if (dreamy) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f4ecff_0%,_#fefdf8_42%,_#fdfaf3_100%)]">
        <header className="sticky top-0 z-30 border-b border-white/40 bg-[rgba(249,244,255,0.78)] backdrop-blur-xl">
          <div className="mx-auto max-w-[1380px] px-4 py-4 md:px-6">
            <div className="grid gap-4 rounded-[2rem] border border-white/50 bg-white/35 px-4 py-4 shadow-[0_18px_60px_rgba(84,58,130,0.08)] backdrop-blur md:px-6 lg:grid-cols-[auto_minmax(0,1fr)_minmax(220px,300px)] lg:items-center">
              <div className="flex items-center gap-4">
                <Link href="/" className="inline-flex h-14 w-14 items-center justify-center rounded-[1.6rem] bg-[linear-gradient(180deg,#34255b,#24183d)] text-lg font-semibold text-white shadow-[0_14px_30px_rgba(50,35,90,0.28)]">
                  {logoText}
                </Link>
                <div>
                  <Link href="/" className="block text-lg font-semibold text-[#2f2050] md:text-xl">
                    {siteName}
                  </Link>
                  <div className="max-w-md text-sm leading-6 text-[#6a5a93]">{headerTagline}</div>
                </div>
              </div>

              <nav className="order-3 flex items-center gap-1 text-sm text-[#5f4b80] lg:order-2 lg:justify-center">
                {[
                  { href: '/', label: 'Acasă' },
                  { href: '/dictionar', label: 'Dictionar' },
                  { href: '/cauta', label: 'Categorii' },
                  { href: '/despre', label: 'Despre' },
                  { href: '/contact', label: 'Contact' },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-lg px-4 py-2 font-medium transition-colors hover:bg-[#f0eaff] hover:text-[#3f2b63]"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="order-2 lg:order-3">
                <SearchForm actionPath={searchPath} variant="dreamy" placeholder="Cauta vise, simboluri..." />
              </div>
            </div>
          </div>
        </header>

        {children}

        <footer className="border-t border-[#ebe1f7] bg-[linear-gradient(180deg,#fffdf8,#f7f1ff)]">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <div className="grid gap-10 border-b border-[#eadff8] pb-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <div>
                <div className="mb-3 text-xs uppercase tracking-[0.24em] text-[#8f78ab]">cand visam</div>
                <div className="max-w-2xl font-serif text-3xl leading-tight text-[#2f2050] md:text-4xl">
                  Un spatiu editorial calm pentru vise, simboluri si intelesuri care merita citite in tihna.
                </div>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5f4b80]">{footerDescription}</p>
                <div className="mt-6 flex flex-wrap gap-3 text-sm">
                  {dictionaryPath && (
                    <Link href={dictionaryPath} className="rounded-full bg-[#2f2050] px-5 py-3 text-white transition-transform duration-300 hover:-translate-y-0.5 hover:bg-[#24183d]">
                      {dictionaryLabel}
                    </Link>
                  )}
                  <Link href={searchPath} className="rounded-full border border-[#d7cceb] bg-white px-5 py-3 text-[#4f35a1] transition-colors hover:border-[#bea8e8] hover:text-[#35246f]">
                    {searchLabel}
                  </Link>
                </div>
              </div>

              <div className="grid gap-8 sm:grid-cols-2">
                <div>
                  <div className="mb-3 text-xs uppercase tracking-[0.22em] text-[#8f78ab]">Exploreaza</div>
                  <div className="grid grid-cols-1 gap-2 text-sm text-[#5f4b80]">
                    {footerLinks.map((link) => (
                      <Link key={link.href} href={link.href} className="hover:text-[#3f2b63]">
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-3 text-xs uppercase tracking-[0.22em] text-[#8f78ab]">Teme populare</div>
                  <div className="grid grid-cols-1 gap-2 text-sm text-[#5f4b80]">
                    {categories.slice(0, 4).map((category) => (
                      <Link key={category.id} href={`/${category.slug}`} className="hover:text-[#3f2b63]">
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-6 text-xs uppercase tracking-[0.18em] text-[#8f78ab] md:flex-row md:items-center md:justify-between">
              <span>Pagani.ro &mdash; Copyright 2026 &nbsp;|&nbsp; <a href="https://stancosmin.com" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[#4f35a1] transition-colors">Crafted by Cosmin Stan</a></span>
              <span>{siteName}</span>
            </div>
          </div>
        </footer>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff3dc_0%,_#fff9ef_42%,_#fffdf9_100%)]">
      <header className="sticky top-0 z-30 border-b border-white/50 bg-[rgba(255,249,239,0.84)] backdrop-blur-xl">
        <div className="mx-auto max-w-[1380px] px-4 py-4 md:px-6">
          <div className="grid gap-4 rounded-[2rem] border border-white/60 bg-white/45 px-4 py-4 shadow-[0_20px_65px_rgba(192,120,34,0.08)] backdrop-blur md:px-6 lg:grid-cols-[auto_minmax(0,1fr)_minmax(280px,420px)] lg:items-center">
            <div className="flex items-center gap-4">
              <Link href="/" className="inline-flex h-14 w-14 items-center justify-center rounded-[1.6rem] bg-[linear-gradient(135deg,#f59e0b,#f97316)] text-lg font-semibold text-white shadow-[0_16px_34px_rgba(245,158,11,0.26)]">
                {logoText}
              </Link>
              <div>
                <Link href="/" className="block text-lg font-semibold text-[#4c2d12] md:text-xl">
                  {siteName}
                </Link>
                <div className="max-w-md text-sm leading-6 text-[#9a5a15]">{headerTagline}</div>
              </div>
            </div>

            <nav className="order-3 flex flex-wrap items-center gap-2 text-sm text-[#7c4810] lg:order-2 lg:justify-center">
              {dictionaryPath && (
                <Link href={dictionaryPath} className="rounded-full border border-[#f1d9b0] bg-white/90 px-3 py-2 transition-colors hover:border-[#f59e0b] hover:text-[#5b3411]">
                  {dictionaryLabel}
                </Link>
              )}
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/${category.slug}`}
                  className="rounded-full border border-[#f1d9b0] bg-white/90 px-3 py-2 transition-colors hover:border-[#f59e0b] hover:text-[#5b3411]"
                >
                  {category.name}
                </Link>
              ))}
            </nav>

            <div className="order-2 lg:order-3">
              <SearchForm actionPath={searchPath} variant="angelic" placeholder="Cauta 111, 222, twin flame, iubire, cariera" />
            </div>
          </div>
        </div>
      </header>

      {children}

      <footer className="border-t border-[#f1ddbc] bg-[linear-gradient(180deg,#fffaf1,#fff4df)]">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid gap-10 border-b border-[#f3e0c4] pb-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <div>
              <div className="mb-3 text-xs uppercase tracking-[0.24em] text-[#b96b12]">numar angelic</div>
              <div className="max-w-2xl font-serif text-3xl leading-tight text-[#4c2d12] md:text-4xl">
                Un spatiu luminos pentru secvente numerice, sincronicitati si ghiduri spirituale care aduc claritate.
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#7c4810]">{footerDescription}</p>
              <div className="mt-6 flex flex-wrap gap-3 text-sm">
                <Link href={searchPath} className="rounded-full bg-[linear-gradient(135deg,#f59e0b,#f97316)] px-5 py-3 text-white transition-transform duration-300 hover:-translate-y-0.5">
                  {searchLabel}
                </Link>
                {categories[0] && (
                  <Link href={`/${categories[0].slug}`} className="rounded-full border border-[#efcf9a] bg-white px-5 py-3 text-[#8a4b10] transition-colors hover:border-[#f59e0b] hover:text-[#5b3411]">
                    Exploreaza ghidurile
                  </Link>
                )}
              </div>
            </div>

            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <div className="mb-3 text-xs uppercase tracking-[0.22em] text-[#b96b12]">Exploreaza</div>
                <div className="grid grid-cols-1 gap-2 text-sm text-[#7c4810]">
                  {footerLinks.map((link) => (
                    <Link key={link.href} href={link.href} className="hover:text-[#5b3411]">
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-3 text-xs uppercase tracking-[0.22em] text-[#b96b12]">Teme principale</div>
                <div className="grid grid-cols-1 gap-2 text-sm text-[#7c4810]">
                  {categories.slice(0, 4).map((category) => (
                    <Link key={category.id} href={`/${category.slug}`} className="hover:text-[#5b3411]">
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-6 text-xs uppercase tracking-[0.18em] text-[#b96b12] md:flex-row md:items-center md:justify-between">
            <span>Claritate spirituala. Trasee scurte. Conversii integrate natural.</span>
            <span>{siteName}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
