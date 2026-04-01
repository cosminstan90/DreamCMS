import type { Metadata } from 'next'
import { StaticPageShell } from '@/components/frontend/StaticPageShell'
import { ContactForm } from '@/components/frontend/ContactForm'
import { getCurrentSiteBranding } from '@/lib/sites/resolver'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Trimite-ne un mesaj pentru intrebari editoriale, colaborari sau semnalari.',
}

export default async function ContactPage() {
  const branding = await getCurrentSiteBranding()
  const dreamy = branding.sitePack.key !== 'numarangelic'

  return (
    <StaticPageShell
      variant={dreamy ? 'dreamy' : 'angelic'}
      eyebrow="Contact"
      title="Contact"
      intro={dreamy
        ? 'Pentru intrebari editoriale, corectii, colaborari sau semnalari legate de continut, completeaza formularul de mai jos.'
        : 'Pentru intrebari editoriale, colaborari, publicitate sau semnalari legate de interpretari si continut, completeaza formularul de mai jos.'}
    >
      <ContactForm variant={dreamy ? 'dreamy' : 'angelic'} />
    </StaticPageShell>
  )
}
