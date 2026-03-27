'use client'

import { useEffect, useMemo, useState } from 'react'
import { readAttribution } from '@/components/analytics/attribution'

type NewsletterCtaProps = {
  sourcePath: string
  title?: string
  subtitle?: string
}

type Variant = 'A' | 'B'

function getStoredVariant(): Variant {
  if (typeof window === 'undefined') return 'A'
  const key = 'dreamcms_newsletter_variant'
  const existing = window.localStorage.getItem(key)
  if (existing === 'A' || existing === 'B') return existing
  const next: Variant = Math.random() < 0.5 ? 'A' : 'B'
  window.localStorage.setItem(key, next)
  return next
}

export function NewsletterCta({
  sourcePath,
  title = 'Primeste interpretari noi direct pe email',
  subtitle = 'Un rezumat clar, practic si fara spam. Poti renunta oricand.',
}: NewsletterCtaProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [variant, setVariant] = useState<Variant>('A')

  useEffect(() => {
    const selected = getStoredVariant()
    setVariant(selected)

    void fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'NEWSLETTER_VIEW',
        route: sourcePath,
        templateType: 'newsletter',
        meta: { variant: selected, attribution: readAttribution() },
      }),
      keepalive: true,
    })
  }, [sourcePath])

  const copy = useMemo(() => {
    if (variant === 'B') {
      return {
        title: 'Vrei interpretari clare pentru visele tale?',
        subtitle: 'Abonare gratuita: idei noi, simboluri si recomandari utile.',
        button: 'Intra in comunitate',
      }
    }

    return {
      title,
      subtitle,
      button: 'Aboneaza-te',
    }
  }, [variant, title, subtitle])

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    setError(null)

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, sourcePath, variant, attribution: readAttribution() }),
      })

      const json = await res.json()
      if (!res.ok) {
        setError(json?.error || 'A aparut o eroare')
        return
      }

      setMessage('Te-ai abonat cu succes. Verifica inbox-ul.')
      setEmail('')
      setName('')
    } catch {
      setError('A aparut o eroare. Incearca din nou.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mt-10 rounded-3xl border border-[#d9cdf4] bg-gradient-to-r from-[#f3edff] to-[#eef2ff] p-6 md:p-8">
      <h3 className="text-2xl font-semibold text-[#2f2050]">{copy.title}</h3>
      <p className="mt-2 text-sm text-[#5f4b80]">{copy.subtitle}</p>

      <form onSubmit={onSubmit} className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Prenume (optional)"
          className="rounded-xl border border-[#d4c5f1] bg-white px-4 py-3 text-[#2f2050] outline-none ring-[#8b5cf6] focus:ring-2"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email-ul tau"
          className="rounded-xl border border-[#d4c5f1] bg-white px-4 py-3 text-[#2f2050] outline-none ring-[#8b5cf6] focus:ring-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-[#8b5cf6] px-5 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Se trimite...' : copy.button}
        </button>
      </form>

      <div className="mt-3 text-xs text-[#6a5a93]">Varianta CTA: {variant}</div>
      {message && <p className="mt-2 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
    </section>
  )
}
