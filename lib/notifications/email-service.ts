import { prisma } from '@/lib/prisma'

const BREVO_API_KEY = process.env.BREVO_API_KEY || ''
const FROM_EMAIL = process.env.BREVO_FROM || 'no-reply@pagani.ro'

export async function sendEmail(to: string, subject: string, html: string) {
  if (!BREVO_API_KEY || !to) return
  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { email: FROM_EMAIL, name: 'DreamCMS' },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  }).catch(() => {})
}

export async function sendBackupNotification(status: 'SUCCESS' | 'FAILED', log: { type: string; fileSize?: number | null; duration?: number | null; error?: string | null }) {
  const settings = await prisma.seoSettings.findFirst()
  if (!settings?.notifyOnBackup || !settings.notifyEmail) return

  const size = log.fileSize ? `${(log.fileSize / 1024 / 1024).toFixed(1)} MB` : 'n/a'
  const duration = log.duration ? `${log.duration}s` : 'n/a'

  const subject = status === 'SUCCESS'
    ? `Backup ${log.type} completat`
    : `ALERTA: Backup ${log.type} a esuat`

  const html = status === 'SUCCESS'
    ? `<p>Backup ${log.type} s-a incheiat cu succes.</p><p>Dimensiune: ${size}<br/>Durata: ${duration}</p>`
    : `<p>Backup ${log.type} a esuat.</p><p>Eroare: ${log.error || 'necunoscuta'}</p>`

  await sendEmail(settings.notifyEmail, subject, html)
}
