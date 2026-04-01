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
        ? 'Pentru intrebari editoriale, corectii, colaborari sau semnalari legate de continut, completeaza formularul de mai jos sau scrie-ne direct.'
        : 'Pentru intrebari editoriale, colaborari, publicitate sau semnalari legate de interpretari si continut, completeaza formularul de mai jos sau scrie-ne direct.'}
    >
      <ContactForm variant={dreamy ? 'dreamy' : 'angelic'} />

      <div className="mt-10 border-t border-current/10 pt-8">
        <p><strong>Email direct:</strong> hello@stancosmin.com</p>
        <p><strong>Subiecte recomandate:</strong> corectii de continut, propuneri de colaborare, publicitate, sesizari privind drepturi sau date personale.</p>
      </div>
    </StaticPageShell>
  )
}
