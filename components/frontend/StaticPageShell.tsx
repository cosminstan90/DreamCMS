import type { ReactNode } from 'react'

type StaticPageShellProps = {
  eyebrow?: string
  title: string
  intro: string
  children: ReactNode
}

export function StaticPageShell({ eyebrow, title, intro, children }: StaticPageShellProps) {
  return (
    <main className="min-h-screen bg-[#fefdf8] text-[#2c2240]">
      <div className="mx-auto max-w-4xl px-6 py-14">
        <section className="rounded-[2rem] border border-[#e7dff4] bg-gradient-to-br from-white to-[#f5efff] p-8 shadow-[0_20px_60px_rgba(79,53,161,0.08)]">
          {eyebrow ? <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#7f67a8]">{eyebrow}</div> : null}
          <h1 className="text-4xl font-semibold text-[#2f2050] md:text-5xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#5f4b80] md:text-lg">{intro}</p>
        </section>

        <section className="prose prose-lg mt-10 max-w-none rounded-[2rem] border border-[#ede5f7] bg-white p-8 prose-headings:text-[#2f2050] prose-a:text-[#4f35a1] prose-strong:text-[#34255b]">
          {children}
        </section>
      </div>
    </main>
  )
}