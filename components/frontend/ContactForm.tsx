'use client'

import { useState, useRef, useEffect } from 'react'

type ContactFormProps = {
  variant?: 'dreamy' | 'angelic'
}

export function ContactForm({ variant = 'dreamy' }: ContactFormProps) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const tsRef = useRef(0)

  useEffect(() => {
    tsRef.current = Date.now()
  }, [])

  const dreamy = variant === 'dreamy'
  const accentText = dreamy ? 'text-[#4f35a1]' : 'text-[#b96b12]'
  const inputBorder = dreamy ? 'border-[#e0d4f5]' : 'border-[#f1d9b0]'
  const inputFocus = dreamy ? 'focus:border-[#bea8e8] focus:ring-[#bea8e8]' : 'focus:border-[#f59e0b] focus:ring-[#f59e0b]'
  const btnBg = dreamy ? 'bg-[#2f2050] hover:bg-[#24183d]' : 'bg-[linear-gradient(135deg,#f59e0b,#f97316)]'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg('')

    const form = e.currentTarget
    const data = new FormData(form)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          email: data.get('email'),
          subject: data.get('subject'),
          message: data.get('message'),
          website: data.get('website'),
          _ts: tsRef.current,
        }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || 'Eroare la trimitere.')
      }

      setStatus('sent')
      form.reset()
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : 'A aparut o eroare. Incearca din nou.')
    }
  }

  if (status === 'sent') {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <div className="text-2xl">&#10003;</div>
        <p className="mt-3 text-lg font-semibold text-green-800">Mesajul a fost trimis!</p>
        <p className="mt-2 text-sm text-green-700">Iti vom raspunde cat de curand posibil.</p>
        <button
          onClick={() => setStatus('idle')}
          className={`mt-6 rounded-full px-6 py-2 text-sm font-medium ${accentText} border ${inputBorder} transition-colors hover:bg-white/80`}
        >
          Trimite alt mesaj
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      {/* Honeypot - hidden from humans */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-current">Nume *</label>
          <input
            type="text"
            id="name"
            name="name"
            required
            maxLength={100}
            className={`w-full rounded-xl border ${inputBorder} bg-white/80 px-4 py-3 text-sm outline-none ring-1 ring-transparent transition ${inputFocus}`}
            placeholder="Numele tau"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-current">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            required
            maxLength={200}
            className={`w-full rounded-xl border ${inputBorder} bg-white/80 px-4 py-3 text-sm outline-none ring-1 ring-transparent transition ${inputFocus}`}
            placeholder="adresa@email.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="subject" className="mb-1.5 block text-sm font-medium text-current">Subiect</label>
        <input
          type="text"
          id="subject"
          name="subject"
          maxLength={200}
          className={`w-full rounded-xl border ${inputBorder} bg-white/80 px-4 py-3 text-sm outline-none ring-1 ring-transparent transition ${inputFocus}`}
          placeholder="Despre ce este vorba?"
        />
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-current">Mesaj *</label>
        <textarea
          id="message"
          name="message"
          required
          maxLength={5000}
          rows={5}
          className={`w-full resize-y rounded-xl border ${inputBorder} bg-white/80 px-4 py-3 text-sm outline-none ring-1 ring-transparent transition ${inputFocus}`}
          placeholder="Scrie mesajul tau aici..."
        />
      </div>

      {status === 'error' && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={status === 'sending'}
          className={`rounded-full ${btnBg} px-8 py-3 text-sm font-medium text-white transition-transform duration-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0`}
        >
          {status === 'sending' ? 'Se trimite...' : 'Trimite mesajul'}
        </button>
      </div>
    </form>
  )
}
