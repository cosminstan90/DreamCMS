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

  const existing = await prisma.redirect.findFirst({ where: { id: params.id, siteId: context.site.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.redirect.update({
    where: { id: params.id },
    data: { isActive: !existing.isActive },
  })

  await invalidateRedirectCache()
  await logAdminAudit({ req, session, action: 'REDIRECT_TOGGLE', entityType: 'redirect', entityId: updated.id, meta: { siteId: context.site.id, isActive: updated.isActive } })
  return NextResponse.json(updated)
}

