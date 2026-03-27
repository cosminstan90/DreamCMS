import type { Metadata } from 'next'
import { StaticPageShell } from '@/components/frontend/StaticPageShell'

export const metadata: Metadata = {
  title: 'Despre',
  description: 'Afla cum este construit proiectul editorial Cand Visam si ce standarde folosim pentru continut.',
}

export default function AboutPage() {
  return (
    <StaticPageShell
      eyebrow="Trust"
      title="Despre Cand Visam"
      intro="Construim un proiect editorial romanesc despre interpretari de vise si simboluri onirice, cu accent pe claritate, context si transparenta fata de cititor."
    >
      <p>
        Cand Visam organizeaza continut despre vise in articole, interpretari tematice si pagini de dictionar. Scopul nostru este sa oferim
        raspunsuri usor de parcurs, bine structurate si utile pentru cititorii care cauta sens, context si legaturi intre simboluri.
      </p>
      <p>
        Folosim procese editoriale interne pentru structurare, actualizare si verificare. Continutul publicat nu inlocuieste evaluarea unui
        specialist medical sau psihologic atunci cand apar situatii sensibile sau recurente.
      </p>
    </StaticPageShell>
  )
}