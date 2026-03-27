import { NextResponse } from 'next/server'
import { sendWeeklyDigest } from '@/lib/notifications/newsletter-service'
import { timingSafeEqualString } from '@/lib/security/secrets'

export async function GET(req: Request) {
  const secret = req.headers.get('x-cron-secret') || ''
  const expected = process.env.CRON_SECRET || ''

  if (!expected || !timingSafeEqualString(secret, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const result = await sendWeeklyDigest()
  return NextResponse.json({ success: true, result })
}
