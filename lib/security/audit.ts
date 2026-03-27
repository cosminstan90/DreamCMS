import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

function getClientIp(req: Request) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || null
}

type AuditInput = {
  req: Request
  session: { user?: { id?: string; email?: string | null } } | null
  action: string
  entityType: string
  entityId?: string | null
  meta?: Record<string, unknown> | null
}

export async function logAdminAudit(input: AuditInput) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        actorId: input.session?.user?.id || null,
        actorEmail: input.session?.user?.email || null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId || null,
        route: new URL(input.req.url).pathname,
        method: input.req.method,
        ip: getClientIp(input.req),
        meta: input.meta ? (input.meta as Prisma.InputJsonValue) : undefined,
      },
    })
  } catch {
    // audit logging must never block the primary action
  }
}