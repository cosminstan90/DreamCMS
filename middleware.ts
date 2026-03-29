import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const authSecret = process.env.NEXTAUTH_SECRET

// ── Rate limiting ──────────────────────────────────────────────────────────────
//
// NOTE: Next.js middleware runs on the Edge Runtime which does NOT support
// Node.js modules (ioredis, net, etc.). We intentionally keep an in-memory Map
// here. This is safe because:
//   1. DreamCMS runs as a SINGLE FORK process (instances: 1, exec_mode: 'fork')
//      so one Map == one source of truth.
//   2. The Map is self-cleaning: expired entries are pruned on every write to
//      keep memory bounded.
//
// For cross-process or multi-instance rate limiting, migrate to a lightweight
// Edge-compatible Redis client (e.g. @upstash/redis).

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

/** Remove expired entries to prevent unbounded Map growth. */
function pruneRateLimitMap() {
  const now = Date.now()
  rateLimitMap.forEach((v, k) => {
    if (v.resetAt < now) rateLimitMap.delete(k)
  })
}

const RATE_LIMITS = {
  '/api/auth/callback/credentials': { max: 5, windowMs: 15 * 60 * 1000 },
  '/api/newsletter/subscribe': { max: 20, windowMs: 15 * 60 * 1000 },
  '/api/analytics/event': { max: 60, windowMs: 60 * 1000 },      // 60 events/min per IP
  '/api/redirects/resolve': { max: 120, windowMs: 60 * 1000 },   // 120 lookups/min per IP
} as const
const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function getConfiguredOrigins(url: URL) {
  return [
    url.origin,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    'https://pagani.ro',
    'https://www.pagani.ro',
    // Allow localhost only in non-production environments
    ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000', 'http://localhost:3001'] : []),
  ].filter(Boolean) as string[]
}

function isAllowedOrigin(origin: string | null, url: URL) {
  if (!origin) return false
  return getConfiguredOrigins(url).some((item) => {
    try {
      return new URL(origin).origin === new URL(item).origin
    } catch {
      return false
    }
  })
}

function isCorsPublicApi(pathname: string) {
  return pathname === '/api/analytics/event'
    || pathname === '/api/newsletter/subscribe'
    || pathname.startsWith('/api/ads/events')
    || pathname.startsWith('/api/affiliate/click/')
}

function isCsrfExempt(pathname: string) {
  return pathname.startsWith('/api/auth/')
    || pathname === '/api/login'
    || pathname === '/api/newsletter/subscribe'
    || pathname === '/api/analytics/event'
    || pathname.startsWith('/api/ads/events')
    || pathname.startsWith('/api/affiliate/click/')
    || pathname.startsWith('/api/affiliate/placement')
    || pathname.startsWith('/api/publisher/receive')
    || pathname.startsWith('/api/publisher/test')
}

function hasValidSameOriginHeaders(req: Request, url: URL) {
  const origin = req.headers.get('origin')
  if (origin) return isAllowedOrigin(origin, url)

  const referer = req.headers.get('referer')
  if (!referer) return false

  try {
    return isAllowedOrigin(new URL(referer).origin, url)
  } catch {
    return false
  }
}

function checkRateLimit(pathname: string, ip: string) {
  const config = RATE_LIMITS[pathname as keyof typeof RATE_LIMITS]
  if (!config) return true

  // Prune stale entries periodically (every ~50 writes) to keep Map bounded
  if (rateLimitMap.size % 50 === 0) pruneRateLimitMap()

  const now = Date.now()
  const key = `${pathname}:${ip}`
  const entry = rateLimitMap.get(key)
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + config.windowMs })
    return true
  }

  if (entry.count >= config.max) return false
  entry.count += 1
  return true
}

export async function middleware(req: Request) {
  const url = new URL(req.url)
  const pathname = url.pathname

  if (pathname.startsWith('/api') && isCorsPublicApi(pathname)) {
    const origin = req.headers.get('origin')
    if (!isAllowedOrigin(origin, url)) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin || '',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Cron-Secret, X-CMS-Token',
          Vary: 'Origin',
        },
      })
    }
  }

  if (pathname in RATE_LIMITS) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!checkRateLimit(pathname, ip)) {
      return new NextResponse('Too Many Requests', { status: 429 })
    }
  }

  if (pathname.startsWith('/api') && MUTATION_METHODS.has(req.method) && !isCsrfExempt(pathname)) {
    if (!hasValidSameOriginHeaders(req, url)) {
      return new NextResponse('Invalid CSRF origin', { status: 403 })
    }
  }

  if (!pathname.startsWith('/api')) {
    try {
      const redirectRes = await fetch(`${url.origin}/api/redirects/resolve?path=${encodeURIComponent(pathname)}`, {
        headers: { 'x-middleware': '1' },
        cache: 'no-store',
      })
      if (redirectRes.ok) {
        const data = await redirectRes.json()
        if (data?.redirect?.toPath) {
          fetch(`${url.origin}/api/redirects/${data.redirect.id}/hits`, { method: 'PATCH' }).catch(() => {})
          return NextResponse.redirect(new URL(data.redirect.toPath, url.origin), data.redirect.statusCode || 301)
        }
      }
    } catch {
      // ignore redirect errors
    }
  }

  if (pathname.startsWith('/admin')) {
    const token = await getToken({
      req,
      secret: authSecret,
      cookieName: 'next-auth.session-token',
      salt: 'next-auth.session-token',
    })
    if (!token) {
      const loginUrl = new URL('/login', url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  const response = NextResponse.next()
  if (pathname.startsWith('/api') && isCorsPublicApi(pathname)) {
    const origin = req.headers.get('origin')
    if (isAllowedOrigin(origin, url)) {
      response.headers.set('Access-Control-Allow-Origin', origin || '')
      response.headers.set('Vary', 'Origin')
    }
  }
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}