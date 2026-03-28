import type { Metadata } from 'next'
import { StaticPageShell } from '@/components/frontend/StaticPageShell'
import { getCurrentSiteBranding } from '@/lib/sites/resolver'

export const metadata: Metadata = {
  title: 'Termeni si conditii',
  description: 'Conditiile generale de utilizare pentru continutul publicat pe site.',
}

export default async function TermsPage() {
  const branding = await getCurrentSiteBranding()
  const dreamy = branding.sitePack.key !== 'numarangelic'

  return (
    <StaticPageShell
      variant={dreamy ? 'dreamy' : 'angelic'}
      eyebrow="Legal"
      title="Termeni si conditii"
      intro="Prin utilizarea site-ului accepti regulile de baza privind accesul la continut, proprietatea intelectuala si limitele responsabilitatii."
    >
      <p>Continutul este oferit in scop informativ. Reproducerea integrala fara acord scris nu este permisa.</p>
      <p>Ne rezervam dreptul de a actualiza, corecta sau retrage pagini, functionalitati ori materiale fara notificare prealabila.</p>
      <p>Utilizatorii sunt responsabili pentru modul in care interpreteaza si folosesc informatiile din site.</p>
    </StaticPageShell>
  )
}
