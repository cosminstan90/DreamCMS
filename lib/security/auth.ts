import { NextResponse } from 'next/server'
import { auth } from '@/auth'

const ROLE_ORDER = {
  EDITOR: 1,
  ADMIN: 2,
} as const

type AllowedRole = keyof typeof ROLE_ORDER

export async function requireRole(role: AllowedRole = 'EDITOR') {
  const session = await auth()
  const currentRole = session?.user?.role as AllowedRole | undefined

  if (!session?.user?.id || !currentRole || ROLE_ORDER[currentRole] < ROLE_ORDER[role]) {
    return {
      session: null,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 403 }),
    }
  }

  return { session, response: null }
}
