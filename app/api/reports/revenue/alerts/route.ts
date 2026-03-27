import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateRevenueReport } from '@/lib/analytics/revenue-report'
import { evaluateRevenueAlerts, getRevenueAlertThresholds } from '@/lib/analytics/revenue-alerts'
import { sendEmail } from '@/lib/notifications/email-service'
import { timingSafeEqualString } from '@/lib/security/secrets'

function buildAlertHtml(alerts: Array<{ label: string; current: number; threshold: number }>) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937">
      <h2>DreamCMS Revenue Alerts</h2>
      <p>S-au detectat praguri sub tinta pe ultimele 7 zile:</p>
      <ul>
        ${alerts.map((item) => `<li>${item.label}: ${item.current} (prag ${item.threshold})</li>`).join('')}
      </ul>
    </div>
  `
}

async function runAlerts(sendNotification: boolean) {
  const report = await generateRevenueReport(7)
  const thresholds = getRevenueAlertThresholds()
  const alerts = evaluateRevenueAlerts(report, thresholds)

  if (sendNotification && alerts.length > 0) {
    const settings = await prisma.seoSettings.findFirst()
    if (settings?.notifyEmail) {
      await sendEmail(settings.notifyEmail, 'DreamCMS Revenue Alerts', buildAlertHtml(alerts))
    }
  }

  return {
    success: true,
    triggered: alerts.length > 0,
    alerts,
    thresholds,
    periodDays: 7,
  }
}

export async function GET(req: Request) {
  const secret = req.headers.get('x-cron-secret') || ''
  const expected = process.env.CRON_SECRET || ''

  if (!expected || !timingSafeEqualString(secret, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const result = await runAlerts(true)
  return NextResponse.json(result)
}

export async function POST() {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const result = await runAlerts(true)
  return NextResponse.json(result)
}
