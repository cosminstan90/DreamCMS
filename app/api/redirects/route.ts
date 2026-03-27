import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/security/auth'
import { prisma } from '@/lib/prisma'
import { invalidateRedirectCache } from '@/lib/redirects/cache'
import { logAdminAudit } from '@/lib/security/audit'
import { requireCurrentSiteResponse } from '@/lib/sites/context'

export async function GET(req: Request) {
  const { response } = await requireRole('ADMIN')
  if (response) return response

  const { context, response: siteResponse } = await requireCurrentSiteResponse()
  if (siteResponse) return siteResponse
  if (!context) return NextResponse.json({ error: 'Active site configuration is missing' }, { status: 500 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '50', 10)
  const search = searchParams.get('search') || ''
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = { siteId: context.site.id }
  if (search) {
    where.OR = [
      { fromPath: { contains: search } },
      { toPath: { contains: search } },
    ]
  }

  const [data, total] = await Promise.all([
    prisma.redirect.findMany({ where, orderBy: { hits: 'desc' }, skip, take: limit }),
    prisma.redirect.count({ where }),
  ])

  return NextResponse.json({ data, total, page, limit })
}

export async function POST(req: Request) {
  const { session, response } = await requireRole('ADMIN')
  if (response || !session) return response

  const { context, response: siteResponse } = await requireCurrentSiteResponse()
  if (siteResponse) return siteResponse
  if (!context) return NextResponse.json({ error: 'Active site configuration is missing' }, { status: 500 })

  const body = await req.json()
  const fromPath = String(body.fromPath || '').trim()
  const toPath = String(body.toPath || '').trim()
  const statusCode = Number(body.statusCode || 301)

  if (!fromPath.startsWith('/')) return NextResponse.json({ error: 'fromPath trebuie sa inceapa cu /' }, { status: 400 })
  if (fromPath === toPath) return NextResponse.json({ error: 'Redirect circular' }, { status: 400 })

  const redirect = await prisma.redirect.create({
    data: {
      siteId: context.site.id,
      fromPath,
      toPath,
      statusCode,
      isActive: true,
    },
  })

  await invalidateRedirectCache()
  await logAdminAudit({ req, session, action: 'REDIRECT_CREATE', entityType: 'redirect', entityId: redirect.id, meta: { siteId: context.site.id, fromPath, toPath, statusCode } })
  return NextResponse.json(redirect, { status: 201 })
}

