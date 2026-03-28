import type { Metadata } from 'next'
import { StaticPageShell } from '@/components/frontend/StaticPageShell'
import { getCurrentSiteBranding } from '@/lib/sites/resolver'

export const metadata: Metadata = {
  title: 'Dezvaluire afiliere si publicitate',
  description: 'Cum folosim linkuri afiliate si publicitate si ce inseamna acestea pentru cititor.',
}

export default async function AffiliateDisclosurePage() {
  const branding = await getCurrentSiteBranding()
  const dreamy = branding.sitePack.key !== 'numarangelic'

  return (
    <StaticPageShell
      variant={dreamy ? 'dreamy' : 'angelic'}
      eyebrow="Monetizare"
      title="Dezvaluire afiliere si publicitate"
      intro="Vrem ca cititorii sa inteleaga clar cand o pagina poate genera venit prin reclame sau linkuri afiliate."
    >
      <p>Unele pagini pot include recomandari comerciale sau linkuri afiliate. Daca ajungi la un produs prin aceste linkuri, putem primi un comision.</p>
      <p>Prezenta unui link afiliat nu schimba pretul pentru utilizator. Selectia produselor urmareste relevanta pentru tema paginii.</p>
      <p>
        {dreamy
          ? 'Reclamele sunt marcate ca spatii publicitare si sunt separate vizual de continutul editorial.'
          : 'Reclamele si recomandarile sponsorizate sunt marcate clar si integrate astfel incat sa nu se confunde cu explicatia editoriala a secventelor numerice.'}
      </p>
    </StaticPageShell>
  )
}
