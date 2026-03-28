import type { Metadata } from 'next'
import { StaticPageShell } from '@/components/frontend/StaticPageShell'
import { getCurrentSiteBranding } from '@/lib/sites/resolver'

export const metadata: Metadata = {
  title: 'Politica editoriala',
  description: 'Standardele editoriale folosite pentru continutul publicat pe site.',
}

export default async function EditorialPolicyPage() {
  const branding = await getCurrentSiteBranding()
  const dreamy = branding.sitePack.key !== 'numarangelic'

  return (
    <StaticPageShell
      variant={dreamy ? 'dreamy' : 'angelic'}
      eyebrow="Editorial"
      title="Politica editoriala"
      intro={dreamy
        ? 'Publicam continut cu structura clara, context util si transparenta privind limitele interpretarilor.'
        : 'Publicam continut cu structura clara, raspuns direct si delimitari corecte intre interpretare editoriala, context spiritual si recomandare practica.'}
    >
      <h2>Cum lucram</h2>
      <p>
        {dreamy
          ? 'Organizam continutul in clustere tematice, dictionar de simboluri si interpretari de vise construite pe intentia reala de cautare a utilizatorilor.'
          : 'Organizam continutul in jurul secventelor numerice si al intentiilor reale de cautare: iubire, twin flame, cariera, bani, manifestare si sincronicitati.'}
      </p>
      <h2>Actualizare si corectie</h2>
      <p>Revizuim periodic paginile importante si corectam rapid erorile factuale, inconsistentele de structurare sau problemele de redactare semnalate.</p>
      <h2>Limite editoriale</h2>
      <p>
        {dreamy
          ? 'Interpretarile au rol informativ si cultural. Nu prezentam continutul ca diagnostic medical, psihologic sau spiritual absolut.'
          : 'Interpretarile au rol informativ si editorial. Nu prezentam continutul ca adevar spiritual garantat, diagnostic psihologic sau recomandare profesionala individuala.'}
      </p>
    </StaticPageShell>
  )
}
