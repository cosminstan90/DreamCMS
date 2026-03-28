import { NextResponse } from 'next/server'

function getAllowedOrigins(req: Request) {
  const url = new URL(req.url)
  return new Set([
    url.origin,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    'https://pagani.ro',
    'https://www.pagani.ro',
    'http://localhost:3000',
  ].filter(Boolean))
}

export function verifySameOriginRequest(req: Request) {
  const allowed = getAllowedOrigins(req)
  const origin = req.headers.get('origin')
  const referer = req.headers.get('referer')

  if (origin) {
    if (allowed.has(origin)) return null
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin
      if (allowed.has(refererOrigin)) return null
    } catch {
      return NextResponse.json({ error: 'Invalid referer' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Invalid referer' }, { status: 403 })
  }

  return NextResponse.json({ error: 'Missing origin' }, { status: 403 })
}