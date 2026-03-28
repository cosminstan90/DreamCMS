'use client'

import { useEffect, useMemo, useState } from 'react'
import { readAttribution } from '@/components/analytics/attribution'

type NewsletterCtaProps = {
  sourcePath: string
  title?: string
  subtitle?: string
  variantStyle?: 'dreamy' | 'angelic'
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
  variantStyle = 'dreamy',
}: NewsletterCtaProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [variant, setVariant] = useState<Variant>('A')
  const dreamy = variantStyle === 'dreamy'

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
        title: dreamy ? 'Vrei interpretari clare pentru visele tale?' : 'Vrei semnificatii clare pentru simbolurile tale?',
        subtitle: dreamy ? 'Abonare gratuita: idei noi, simboluri si recomandari utile.' : 'Abonare gratuita: semnificatii, simboluri si ghiduri spirituale utile.',
        button: dreamy ? 'Intra in cercul editorial' : 'Intra in comunitate',
      }
    }

    return {
      title,
      subtitle,
      button: dreamy ? 'Aboneaza-te' : 'Intra in lista',
    }
  }, [dreamy, variant, title, subtitle])

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
    <section className={dreamy ? 'mt-10 overflow-hidden rounded-[2.4rem] border border-[#ded1f5] bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(243,236,255,0.9),rgba(255,244,248,0.92))] p-6 shadow-[0_26px_80px_rgba(88,59,136,0.1)] md:p-8' : 'mt-10 overflow-hidden rounded-[2.4rem] border border-[#efd2a2] bg-[linear-gradient(135deg,#fffaf0,#fff0d7)] p-6 shadow-[0_20px_60px_rgba(245,158,11,0.1)] md:p-8'}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.85fr)] lg:items-end">
        <div>
          <div className={dreamy ? 'mb-3 inline-flex rounded-full border border-[#dfd1f5] bg-white/80 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[#7b67a5]' : 'mb-3 inline-flex rounded-full border border-[#efcf9a] bg-white/90 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-[#b96b12]'}>
            {dreamy ? 'newsletter editorial' : 'ghid spiritual'}
          </div>
          <h3 className={dreamy ? 'max-w-xl font-serif text-3xl leading-tight text-[#2f2050] md:text-4xl' : 'max-w-xl font-serif text-3xl leading-tight text-[#4c2d12] md:text-4xl'}>{copy.title}</h3>
          <p className={dreamy ? 'mt-3 max-w-xl text-sm leading-7 text-[#5f4b80]' : 'mt-3 max-w-xl text-sm leading-7 text-[#7c4810]'}>{copy.subtitle}</p>
          <div className={dreamy ? 'mt-5 text-xs uppercase tracking-[0.2em] text-[#8f78ab]' : 'mt-5 text-xs uppercase tracking-[0.2em] text-[#b96b12]'}>
            Varianta CTA: {variant}
          </div>
        </div>

        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr]">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Prenume (optional)"
              className={dreamy ? 'rounded-2xl border border-[#d4c5f1] bg-white/90 px-4 py-3 text-[#2f2050] outline-none ring-[#8b5cf6] focus:ring-2' : 'rounded-2xl border border-[#efcf9a] bg-white px-4 py-3 text-[#5b3411] outline-none ring-[#f59e0b] focus:ring-2'}
            />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email-ul tau"
              className={dreamy ? 'rounded-2xl border border-[#d4c5f1] bg-white/90 px-4 py-3 text-[#2f2050] outline-none ring-[#8b5cf6] focus:ring-2' : 'rounded-2xl border border-[#efcf9a] bg-white px-4 py-3 text-[#5b3411] outline-none ring-[#f59e0b] focus:ring-2'}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={dreamy ? 'rounded-2xl bg-[#8b5cf6] px-5 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50' : 'rounded-2xl bg-[linear-gradient(135deg,#f59e0b,#f97316)] px-5 py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50'}
          >
            {loading ? 'Se trimite...' : copy.button}
          </button>
        </form>
      </div>

      {message && <p className="mt-4 text-sm text-emerald-700">{message}</p>}
      {error && <p className="mt-4 text-sm text-rose-700">{error}</p>}
    </section>
  )
}
