import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const body = await req.json()
  const status = typeof body?.status === 'string' ? body.status.toUpperCase() : ''
  if (status !== 'ACTIVE' && status !== 'UNSUBSCRIBED') {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const updated = await prisma.newsletterSubscriber.update({
    where: { id: params.id },
    data: { status },
  })

  return NextResponse.json(updated)
}
