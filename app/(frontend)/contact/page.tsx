import type { Metadata } from 'next'
import { StaticPageShell } from '@/components/frontend/StaticPageShell'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Date de contact pentru echipa editoriala Cand Visam.',
}

export default function ContactPage() {
  return (
    <StaticPageShell
      eyebrow="Contact"
      title="Contact"
      intro="Pentru intrebari editoriale, corectii, colaborari sau semnalari legate de continut, foloseste canalele de mai jos."
    >
      <p><strong>Email editorial:</strong> contact@candvisam.ro</p>
      <p><strong>Subiecte recomandate:</strong> corectii de continut, propuneri de colaborare, publicitate, sesizari privind drepturi sau date personale.</p>
      <p>
        Pentru solicitari legate de confidentialitate sau stergerea datelor, mentioneaza clar tipul cererii si adresa folosita in interactiunea cu site-ul.
      </p>
    </StaticPageShell>
  )
}