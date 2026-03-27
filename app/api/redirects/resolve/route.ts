import { NextResponse } from 'next/server'
import { getRedirectForPath } from '@/lib/redirects/cache'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const path = String(url.searchParams.get('path') || '')
  if (!path) return NextResponse.json({ redirect: null })

  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || url.host
  const redirect = await getRedirectForPath(path, host)
  return NextResponse.json({ redirect })
}
