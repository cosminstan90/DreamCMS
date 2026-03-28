'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { Moon } from 'lucide-react'
import { authenticate } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full py-3 mt-6 text-sm font-semibold rounded-lg bg-[#8b5cf6] hover:bg-[#7c3aed] text-white transition-colors ${
        pending ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {pending ? 'Se autentifica...' : 'Autentificare'}
    </button>
  )
}

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [errorMessage, dispatch] = useFormState(authenticate, undefined)

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

        <form action={dispatch} className="flex flex-col gap-4">
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
              className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-transparent transition"
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
              className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-transparent transition"
              placeholder="********"
            />
          </div>

          {errorMessage && (
            <div className="p-3 mt-2 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg">
              {errorMessage}
            </div>
          )}

          <SubmitButton />
        </form>
      </div>
    </main>
  )
}
