import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/notifications/email-service'

const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'hello@stancosmin.com'
const HONEYPOT_FIELD = 'website' // bots fill this in, humans don't see it

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, subject, message, website, _ts } = body as {
      name?: string
      email?: string
      subject?: string
      message?: string
      website?: string
      _ts?: number
    }

    // ── Bot protection ──────────────────────────────────────────────────
    // 1. Honeypot: hidden field that bots auto-fill
    if (website) {
      return NextResponse.json({ ok: true }) // silently accept
    }

    // 2. Timing: form submitted too fast (< 2 seconds)
    if (_ts && Date.now() - _ts < 2000) {
      return NextResponse.json({ ok: true }) // silently accept
    }

    // ── Validation ──────────────────────────────────────────────────────
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Completeaza toate campurile obligatorii.' }, { status: 400 })
    }

    if (name.length > 100 || email.length > 200 || message.length > 5000) {
      return NextResponse.json({ error: 'Unul dintre campuri depaseste limita de caractere.' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Adresa de email nu este valida.' }, { status: 400 })
    }

    // ── Send email ──────────────────────────────────────────────────────
    const safeHtml = `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#1f2937">
        <h2 style="color:#2f2050">Mesaj nou de pe Pagani.ro</h2>
        <p><strong>Nume:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        ${subject ? `<p><strong>Subiect:</strong> ${escapeHtml(subject)}</p>` : ''}
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0" />
        <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
      </div>
    `

    await sendEmail(
      CONTACT_EMAIL,
      `[Pagani.ro] ${subject ? escapeHtml(subject) : 'Mesaj de contact'}`,
      safeHtml,
    )

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'A aparut o eroare. Incearca din nou.' }, { status: 500 })
  }
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
