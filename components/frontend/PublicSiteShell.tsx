import Link from 'next/link'
import type { ReactNode } from 'react'
import { SearchForm } from '@/components/frontend/SearchForm'
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
}: PublicSiteShellProps) {
  return (
    <div className="min-h-screen bg-[#f7f1ff]">
      <header className="sticky top-0 z-30 border-b border-[#e8def6] bg-[rgba(254,253,248,0.92)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2f2050] text-lg font-semibold text-white">
                {logoText}
              </Link>
              <div>
                <Link href="/" className="block text-lg font-semibold text-[#2f2050]">
                  {siteName}
                </Link>
                <div className="text-sm text-[#6a5a93]">{headerTagline}</div>
              </div>
            </div>

            <div className="w-full md:max-w-md">
              <SearchForm actionPath={searchPath} />
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2 text-sm text-[#5f4b80]">
            {dictionaryPath && (
              <Link href={dictionaryPath} className="rounded-full border border-[#dfd5ef] bg-white px-3 py-2 hover:border-[#c9b7e8] hover:text-[#3f2b63]">
                {dictionaryLabel}
              </Link>
            )}
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/${category.slug}`}
                className="rounded-full border border-[#dfd5ef] bg-white px-3 py-2 hover:border-[#c9b7e8] hover:text-[#3f2b63]"
              >
                {category.name}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {children}

      <footer className="border-t border-[#e7def5] bg-[#fffdf8]">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="text-xl font-semibold text-[#2f2050]">{siteName}</div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5f4b80]">{footerDescription}</p>
            <div className="mt-5 flex flex-wrap gap-2 text-sm">
              {dictionaryPath && (
                <Link href={dictionaryPath} className="rounded-full bg-[#2f2050] px-4 py-2 text-white">
                  {dictionaryLabel}
                </Link>
              )}
              <Link href={searchPath} className="rounded-full border border-[#d7cceb] bg-white px-4 py-2 text-[#4f35a1]">
                {searchLabel}
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 text-sm text-[#5f4b80]">
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-[#3f2b63]">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}