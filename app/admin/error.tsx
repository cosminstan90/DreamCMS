'use client'

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 text-6xl font-semibold text-slate-700">500</div>
      <h1 className="mb-2 text-2xl font-semibold text-white">Eroare în admin</h1>
      <p className="mb-6 max-w-md text-sm text-slate-400">
        {error?.message || 'A apărut o eroare neașteptată.'}
        {error?.digest && <span className="mt-1 block text-xs text-slate-500">ID: {error.digest}</span>}
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-[#8b5cf6] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#7c3aed]"
      >
        Încearcă din nou
      </button>
    </div>
  )
}
