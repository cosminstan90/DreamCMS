'use client'

import { FormEvent, useState } from 'react'
import { Moon } from 'lucide-react'

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string>('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError('')

    const form = e.currentTarget
    const formData = new FormData(form)

    try {
      const response = await fetch('/api/auth/callback/credentials', {
        method: 'POST',
        body: new URLSearchParams(formData as unknown as Record<string, string>),
        redirect: 'manual',
      })

      if (response.status === 302) {
        const location = response.headers.get('location')
        if (location) {
          window.location.href = location
        }
      } else if (response.status === 401) {
        setError('Email sau parolă invalidă.')
      } else {
        setError('Eroare necunoscută la autentificare.')
      }
    } catch (err) {
      setError('Eroare de conexiune. Încercați din nou.')
      console.error('Auth error:', err)
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0f172a] text-slate-200 px-4">
      <div className="w-full max-w-md p-8 bg-[#1e293b] rounded-2xl border border-slate-700 shadow-xl">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-[#8b5cf6]/15 rounded-full mb-4">
            <Moon className="w-10 h-10 text-[#8b5cf6]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mb-1">DreamCMS - pagani.ro</h1>
          <p className="text-slate-400 text-sm">Autentificare in panoul administrativ</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />

          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-300" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              required
              disabled={pending}
              className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-transparent transition disabled:opacity-50"
              placeholder="nume@pagani.ro"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5 text-slate-300" htmlFor="password">
              Parola
            </label>
            <input
              id="password"
              type="password"
              name="password"
              required
              disabled={pending}
              className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-transparent transition disabled:opacity-50"
              placeholder="********"
            />
          </div>

          {error && (
            <div className="p-3 mt-2 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className={`w-full py-3 mt-6 text-sm font-semibold rounded-lg bg-[#8b5cf6] hover:bg-[#7c3aed] text-white transition-colors ${
              pending ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {pending ? 'Se autentifica...' : 'Autentificare'}
          </button>
        </form>
      </div>
    </main>
  )
}
