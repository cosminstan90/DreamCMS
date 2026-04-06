'use client'

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ro">
      <body className="min-h-screen bg-[#fdf8ff] text-[#2c2240]">
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <div className="mb-6 text-[7rem] font-semibold leading-none text-[#e8dff5]">500</div>
          <h1 className="mb-3 text-3xl font-semibold text-[#2f2050]">A apărut o eroare</h1>
          <p className="mb-8 max-w-md text-base leading-7 text-[#5f4b80]">
            Ceva nu a mers cum trebuie. Încearcă să reîncarci pagina.
          </p>
          <button
            onClick={reset}
            className="rounded-full bg-[#2f2050] px-8 py-3 text-sm font-medium text-white transition-transform duration-300 hover:-translate-y-0.5 hover:bg-[#24183d]"
          >
            Încearcă din nou
          </button>
        </div>
      </body>
    </html>
  )
}
