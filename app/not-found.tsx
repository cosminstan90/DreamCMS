import Link from 'next/link'

export default function NotFound() {
  return (
    <html lang="ro">
      <body className="min-h-screen bg-[radial-gradient(circle_at_top,_#f4ecff_0%,_#fefdf8_42%,_#fdfaf3_100%)] text-[#2c2240]">
        <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
          <div className="mb-6 text-[7rem] font-semibold leading-none text-[#e8dff5]">404</div>
          <h1 className="mb-3 text-3xl font-semibold text-[#2f2050]">Pagina nu a fost găsită</h1>
          <p className="mb-8 max-w-md text-base leading-7 text-[#5f4b80]">
            Pagina pe care o cauți nu există sau a fost mutată. Încearcă să revii la pagina principală.
          </p>
          <Link
            href="/"
            className="rounded-full bg-[#2f2050] px-8 py-3 text-sm font-medium text-white transition-transform duration-300 hover:-translate-y-0.5 hover:bg-[#24183d]"
          >
            Înapoi acasă
          </Link>
        </div>
      </body>
    </html>
  )
}
