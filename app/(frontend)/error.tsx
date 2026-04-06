'use client'

import Link from 'next/link'

export default function FrontendError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-[70vh] bg-[radial-gradient(circle_at_top,_#f4ecff_0%,_#fefdf8_42%,_#fdfaf3_100%)]">
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <div className="mb-4 text-[6rem] font-semibold leading-none text-[#e8dff5]">500</div>
        <h1 className="mb-3 text-3xl font-semibold text-[#2f2050]">Ceva nu a mers cum trebuie</h1>
        <p className="mb-8 max-w-md text-base leading-7 text-[#5f4b80]">
          A apărut o eroare la încărcarea paginii. Poți reîncerca sau reveni acasă.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-full bg-[#2f2050] px-7 py-3 text-sm font-medium text-white transition-transform duration-300 hover:-translate-y-0.5 hover:bg-[#24183d]"
          >
            Încearcă din nou
          </button>
          <Link
            href="/"
            className="rounded-full border border-[#d7cceb] bg-white px-7 py-3 text-sm font-medium text-[#4f35a1] transition-colors hover:border-[#bea8e8]"
          >
            Acasă
          </Link>
        </div>
      </div>
    </main>
  )
}
