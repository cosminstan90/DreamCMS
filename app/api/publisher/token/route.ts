import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getPublisherToken, regeneratePublisherToken } from '@/lib/publisher/token'
import { logAdminAudit } from '@/lib/security/audit'

function maskToken(token: string) {
  if (!token) return ''
  const start = token.slice(0, 4)
  const end = token.slice(-4)
  return `${start}...${end}`
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const token = await getPublisherToken()
  return NextResponse.json({ tokenMasked: maskToken(token) })
}

export async function POST(req: Request) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const token = await regeneratePublisherToken()
  await logAdminAudit({ req, session, action: 'PUBLISHER_TOKEN_ROTATE', entityType: 'publisherToken' })
  return NextResponse.json({ token })
}
