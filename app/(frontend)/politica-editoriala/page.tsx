import type { Metadata } from 'next'
import { StaticPageShell } from '@/components/frontend/StaticPageShell'

export const metadata: Metadata = {
  title: 'Politica editoriala',
  description: 'Standardele editoriale folosite de Cand Visam pentru continutul despre vise si simboluri.',
}

export default function EditorialPolicyPage() {
  return (
    <StaticPageShell
      eyebrow="Editorial"
      title="Politica editoriala"
      intro="Publicam continut cu structura clara, context util si transparenta privind limitele interpretarilor."
    >
      <h2>Cum lucram</h2>
      <p>Organizam continutul in clustere tematice, dictionar de simboluri si interpretari de vise construite pe intentia reala de cautare a utilizatorilor.</p>
      <h2>Actualizare si corectie</h2>
      <p>Revizuim periodic paginile importante si corectam rapid erorile factuale, inconsistentele de structurare sau problemele de redactare semnalate.</p>
      <h2>Limite editoriale</h2>
      <p>Interpretarile au rol informativ si cultural. Nu prezentam continutul ca diagnostic medical, psihologic sau spiritual absolut.</p>
    </StaticPageShell>
  )
}