import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/security/auth'
import { prisma } from '@/lib/prisma'
import { invalidateRedirectCache } from '@/lib/redirects/cache'
import { logAdminAudit } from '@/lib/security/audit'
import { requireCurrentSiteResponse } from '@/lib/sites/context'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
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

  const existing = await prisma.redirect.findFirst({ where: { id: params.id, siteId: context.site.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const redirect = await prisma.redirect.update({
    where: { id: params.id },
    data: { fromPath, toPath, statusCode },
  })

  await invalidateRedirectCache()
  await logAdminAudit({ req, session, action: 'REDIRECT_UPDATE', entityType: 'redirect', entityId: redirect.id, meta: { siteId: context.site.id, fromPath, toPath, statusCode } })
  return NextResponse.json(redirect)
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { session, response } = await requireRole('ADMIN')
  if (response || !session) return response

  const { context, response: siteResponse } = await requireCurrentSiteResponse()
  if (siteResponse) return siteResponse
  if (!context) return NextResponse.json({ error: 'Active site configuration is missing' }, { status: 500 })

  const existing = await prisma.redirect.findFirst({ where: { id: params.id, siteId: context.site.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.redirect.delete({ where: { id: params.id } })
  await invalidateRedirectCache()
  await logAdminAudit({ req, session, action: 'REDIRECT_DELETE', entityType: 'redirect', entityId: params.id, meta: { siteId: context.site.id } })
  return NextResponse.json({ success: true })
}

