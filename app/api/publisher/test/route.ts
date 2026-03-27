import { NextResponse } from 'next/server'
import { getPublisherToken, timingSafeEqualString } from '@/lib/publisher/token'

export async function POST(req: Request) {
  const headerToken = req.headers.get('X-CMS-Token') || ''
  const token = await getPublisherToken()
  if (!token || !timingSafeEqualString(headerToken, token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  return NextResponse.json({ ok: true })
}
