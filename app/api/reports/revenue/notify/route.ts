import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateRevenueReport } from '@/lib/analytics/revenue-report'
import { sendEmail } from '@/lib/notifications/email-service'
import { timingSafeEqualString } from '@/lib/security/secrets'

function currency(value: number) {
  return `${value.toFixed(2)} EUR`
}

async function sendRevenueEmail() {
  const settings = await prisma.seoSettings.findFirst()
  if (!settings?.notifyEmail) {
    return { ok: false as const, status: 400, error: 'notifyEmail not configured' }
  }

  const report = await generateRevenueReport(7)
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937">
      <h2>DreamCMS Revenue Report (7 zile)</h2>
      <p>Interval: ${new Date(report.from).toLocaleDateString('ro-RO')} - ${new Date(report.to).toLocaleDateString('ro-RO')}</p>
      <ul>
        <li>PageViews: ${report.totals.pageViews}</li>
        <li>Ad impressions: ${report.totals.adImpressions}</li>
        <li>Ad CTR: ${report.totals.adCtr}%</li>
        <li>Affiliate clicks: ${report.totals.affiliateClicks}</li>
        <li>Newsletter signups: ${report.totals.newsletterSignups}</li>
        <li>Venit estimat total: <strong>${currency(report.totals.estimatedTotalRevenue)}</strong></li>
      </ul>
      <h3>Top pagini</h3>
      <ol>
        ${report.topRoutes.slice(0, 8).map((row) => `<li>${row.route} - ${currency(row.estimatedRevenue)}</li>`).join('')}
      </ol>
    </div>
  `

  await sendEmail(settings.notifyEmail, 'DreamCMS Revenue Report (7 zile)', html)
  return { ok: true as const, status: 200, sentTo: settings.notifyEmail, total: report.totals.estimatedTotalRevenue }
}

export async function GET(req: Request) {
  const secret = req.headers.get('x-cron-secret') || ''
  const expected = process.env.CRON_SECRET || ''

  if (!expected || !timingSafeEqualString(secret, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const result = await sendRevenueEmail()
  if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: result.status })
  return NextResponse.json({ success: true, sentTo: result.sentTo, total: result.total })
}

export async function POST() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const result = await sendRevenueEmail()
  if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: result.status })
  return NextResponse.json({ success: true, sentTo: result.sentTo, total: result.total })
}
