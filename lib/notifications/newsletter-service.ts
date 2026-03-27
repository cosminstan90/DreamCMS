import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/notifications/email-service'

function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildWelcomeHtml(name: string | null) {
  const safeName = name ? escapeHtml(name) : ''
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937">
      <h2>Bine ai venit la Cand Visam</h2>
      <p>${safeName ? `Salut, ${safeName}!` : 'Salut!'} Iti multumim pentru abonare.</p>
      <p>Vei primi interpretari de vise, simboluri noi si idei practice pentru continutul oneiric.</p>
      <p style="font-size:12px;color:#6b7280">Daca nu doresti emailuri viitoare, poti raspunde cu "unsubscribe".</p>
    </div>
  `
}

export async function sendNewsletterWelcomeEmail(email: string, name: string | null) {
  await sendEmail(email, 'Bine ai venit la Cand Visam', buildWelcomeHtml(name))
}

function buildDigestHtml(items: Array<{ title: string; excerpt: string | null; url: string; publishedAt: Date | null }>, siteUrl: string) {
  const list = items
    .map((item) => {
      const title = escapeHtml(item.title)
      const excerpt = escapeHtml(item.excerpt || '').slice(0, 200)
      const date = item.publishedAt ? item.publishedAt.toLocaleDateString('ro-RO') : ''
      return `<li style="margin-bottom:14px"><a href="${item.url}" style="color:#6d28d9;text-decoration:none;font-weight:600">${title}</a><div style="font-size:12px;color:#6b7280">${date}</div><div style="margin-top:4px">${excerpt}</div></li>`
    })
    .join('')

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937">
      <h2>Digest saptamanal Cand Visam</h2>
      <p>Top continut publicat recent pe ${siteUrl}.</p>
      <ul style="padding-left:18px">${list}</ul>
      <p><a href="${siteUrl}" style="color:#6d28d9">Vezi toate articolele</a></p>
    </div>
  `
}

export async function sendWeeklyDigest(maxRecipients = 500) {
  const settings = await prisma.seoSettings.findFirst()
  const siteUrl = (settings?.siteUrl || 'https://candvisam.ro').replace(/\/$/, '')

  const since = new Date()
  since.setDate(since.getDate() - 7)

  const posts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: { gte: since },
    },
    orderBy: { publishedAt: 'desc' },
    take: 12,
    select: {
      title: true,
      slug: true,
      excerpt: true,
      publishedAt: true,
      category: { select: { slug: true } },
    },
  })

  if (posts.length === 0) {
    return { sent: 0, skipped: 0, reason: 'NO_CONTENT' as const }
  }

  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
    take: maxRecipients,
    select: { email: true },
  })

  if (subscribers.length === 0) {
    return { sent: 0, skipped: 0, reason: 'NO_SUBSCRIBERS' as const }
  }

  const items = posts.map((post) => ({
    title: post.title,
    excerpt: post.excerpt,
    publishedAt: post.publishedAt,
    url: `${siteUrl}/${post.category?.slug || ''}/${post.slug}`,
  }))

  const html = buildDigestHtml(items, siteUrl)
  let sent = 0

  for (const subscriber of subscribers) {
    await sendEmail(subscriber.email, 'Digest saptamanal - Cand Visam', html)
    sent += 1
  }

  return { sent, skipped: Math.max(0, subscribers.length - sent), reason: 'SENT' as const }
}
