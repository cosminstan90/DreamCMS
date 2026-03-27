import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { resolveCurrentSite } from '@/lib/sites/resolver'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export async function generateMetadata(): Promise<Metadata> {
  const { site } = await resolveCurrentSite()
  const siteUrl = site.siteUrl || 'https://candvisam.ro'
  const siteName = site.name || 'Cand Visam'
  const description = site.description || 'Interpretari de vise, simboluri onirice si ghiduri editoriale pentru publicul din Romania.'

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description,
    alternates: {
      canonical: '/',
    },
    openGraph: {
      type: 'website',
      url: siteUrl,
      siteName,
      title: siteName,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title: siteName,
      description,
    },
  }
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { site } = await resolveCurrentSite()

  return (
    <html lang={site.locale || 'ro'}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}