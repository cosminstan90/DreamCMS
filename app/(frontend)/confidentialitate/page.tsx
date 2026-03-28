import type { Metadata } from 'next'
import { StaticPageShell } from '@/components/frontend/StaticPageShell'
import { getCurrentSiteBranding } from '@/lib/sites/resolver'

export const metadata: Metadata = {
  title: 'Politica de confidentialitate',
  description: 'Informatii despre datele colectate si modul in care sunt folosite pe site.',
}

export default async function PrivacyPage() {
  const branding = await getCurrentSiteBranding()
  const dreamy = branding.sitePack.key !== 'numarangelic'

  return (
    <StaticPageShell
      variant={dreamy ? 'dreamy' : 'angelic'}
      eyebrow="Legal"
      title="Politica de confidentialitate"
      intro="Explicam pe scurt ce date pot fi colectate si cum sunt folosite pentru functionarea si imbunatatirea site-ului."
    >
      <p>Putem colecta date tehnice standard precum IP, user-agent, pagini vizitate si evenimente analitice pentru a intelege performanta continutului.</p>
      <p>In cazul abonarii la newsletter, stocam adresa de email si metadate legate de sursa abonarii pentru raportare si optimizare.</p>
      <p>Nu vindem date personale. Cererile legate de acces, rectificare sau stergere pot fi trimise la contact@candvisam.ro.</p>
    </StaticPageShell>
  )
}
