import type { ReactNode } from 'react'

type StaticPageShellProps = {
  eyebrow?: string
  title: string
  intro: string
  children: ReactNode
  variant?: 'dreamy' | 'angelic'
}

export function StaticPageShell({ eyebrow, title, intro, children, variant = 'dreamy' }: StaticPageShellProps) {
  const dreamy = variant === 'dreamy'

  return (
    <main className={dreamy ? 'min-h-screen bg-[#fefdf8] text-[#2c2240]' : 'min-h-screen bg-[radial-gradient(circle_at_top,_#fff4de_0%,_#fff9ef_42%,_#fffdf9_100%)] text-[#4c2d12]'}>
      <div className="mx-auto max-w-4xl px-6 py-14">
        <section className={dreamy ? 'rounded-[2rem] border border-[#e7dff4] bg-gradient-to-br from-white to-[#f5efff] p-8 shadow-[0_20px_60px_rgba(79,53,161,0.08)]' : 'rounded-[2rem] border border-[#f1ddbc] bg-[linear-gradient(135deg,#fffdfa,#fff3df)] p-8 shadow-[0_20px_60px_rgba(191,118,28,0.08)]'}>
          {eyebrow ? <div className={dreamy ? 'mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#7f67a8]' : 'mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#b96b12]'}>{eyebrow}</div> : null}
          <h1 className={dreamy ? 'text-4xl font-semibold text-[#2f2050] md:text-5xl' : 'font-serif text-4xl text-[#4c2d12] md:text-5xl'}>{title}</h1>
          <p className={dreamy ? 'mt-4 max-w-2xl text-base leading-7 text-[#5f4b80] md:text-lg' : 'mt-4 max-w-2xl text-base leading-7 text-[#7c4810] md:text-lg'}>{intro}</p>
        </section>

        <section className={dreamy ? 'prose prose-lg mt-10 max-w-none rounded-[2rem] border border-[#ede5f7] bg-white p-8 prose-headings:text-[#2f2050] prose-a:text-[#4f35a1] prose-strong:text-[#34255b]' : 'prose prose-lg mt-10 max-w-none rounded-[2rem] border border-[#f1ddbc] bg-white p-8 prose-headings:font-serif prose-headings:text-[#4c2d12] prose-a:text-[#c26c12] prose-strong:text-[#5b3411]'}>
          {children}
        </section>
      </div>
    </main>
  )
}
