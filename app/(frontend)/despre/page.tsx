import type { Metadata } from 'next'
import { StaticPageShell } from '@/components/frontend/StaticPageShell'
import { getCurrentSiteBranding } from '@/lib/sites/resolver'

export const metadata: Metadata = {
  title: 'Despre',
  description: 'Afla cum este construit proiectul editorial si ce standarde folosim pentru continut.',
}

export default async function AboutPage() {
  const branding = await getCurrentSiteBranding()
  const dreamy = branding.sitePack.key !== 'numarangelic'

  return (
    <StaticPageShell
      variant={dreamy ? 'dreamy' : 'angelic'}
      eyebrow="Trust"
      title={dreamy ? 'Despre Cand Visam' : 'Despre Numar Angelic'}
      intro={dreamy
        ? 'Construim un proiect editorial romanesc despre interpretari de vise si simboluri onirice, cu accent pe claritate, context si transparenta fata de cititor.'
        : 'Construim un proiect editorial romanesc despre numere angelice, sincronicitati si interpretari spirituale, cu accent pe claritate, calm si utilitate reala pentru cititor.'}
    >
      {dreamy ? (
        <>
          <p>
            Cand Visam organizeaza continut despre vise in articole, interpretari tematice si pagini de dictionar. Scopul nostru este sa oferim
            raspunsuri usor de parcurs, bine structurate si utile pentru cititorii care cauta sens, context si legaturi intre simboluri.
          </p>
          <p>
            Folosim procese editoriale interne pentru structurare, actualizare si verificare. Continutul publicat nu inlocuieste evaluarea unui
            specialist medical sau psihologic atunci cand apar situatii sensibile sau recurente.
          </p>
        </>
      ) : (
        <>
          <p>
            Numar Angelic organizeaza continut despre secvente numerice, mesaje repetitive si ghiduri spirituale in jurul unor intentii reale de cautare:
            iubire, twin flame, manifestare, bani, cariera si claritate emotionala.
          </p>
          <p>
            Construim paginile astfel incat cititorul sa primeasca intai raspunsul rapid, apoi contextul si pasul urmator. Continutul are rol informativ
            si editorial si nu este prezentat ca adevar spiritual absolut sau consiliere profesionala personalizata.
          </p>
        </>
      )}
    </StaticPageShell>
  )
}
