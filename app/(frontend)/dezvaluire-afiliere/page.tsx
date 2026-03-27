import type { Metadata } from 'next'
import { StaticPageShell } from '@/components/frontend/StaticPageShell'

export const metadata: Metadata = {
  title: 'Dezvaluire afiliere si publicitate',
  description: 'Cum foloseste Cand Visam linkuri afiliate si publicitate si ce inseamna acestea pentru cititor.',
}

export default function AffiliateDisclosurePage() {
  return (
    <StaticPageShell
      eyebrow="Monetizare"
      title="Dezvaluire afiliere si publicitate"
      intro="Vrem ca cititorii sa inteleaga clar cand o pagina poate genera venit prin reclame sau linkuri afiliate."
    >
      <p>Unele pagini pot include recomandari comerciale sau linkuri afiliate. Daca ajungi la un produs prin aceste linkuri, putem primi un comision.</p>
      <p>Prezenta unui link afiliat nu schimba pretul pentru utilizator. Selectia produselor urmareste relevanta pentru tema paginii.</p>
      <p>Reclamele sunt marcate ca spatii publicitare si sunt separate vizual de continutul editorial.</p>
    </StaticPageShell>
  )
}