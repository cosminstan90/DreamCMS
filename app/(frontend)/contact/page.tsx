import type { Metadata } from 'next'
import { StaticPageShell } from '@/components/frontend/StaticPageShell'
import { getCurrentSiteBranding } from '@/lib/sites/resolver'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Date de contact pentru echipa editoriala.',
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
        ? 'Pentru intrebari editoriale, corectii, colaborari sau semnalari legate de continut, foloseste canalele de mai jos.'
        : 'Pentru intrebari editoriale, colaborari, publicitate sau semnalari legate de interpretari si continut, foloseste canalele de mai jos.'}
    >
      <p><strong>Email editorial:</strong> contact@pagani.ro</p>
      <p><strong>Subiecte recomandate:</strong> corectii de continut, propuneri de colaborare, publicitate, sesizari privind drepturi sau date personale.</p>
      <p>
        Pentru solicitari legate de confidentialitate sau stergerea datelor, mentioneaza clar tipul cererii si adresa folosita in interactiunea cu site-ul.
      </p>
    </StaticPageShell>
  )
}
