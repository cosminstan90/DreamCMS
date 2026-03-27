import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const posts = await prisma.post.findMany({
    where: { publisherPageId: { not: null } },
    orderBy: { updatedAt: 'desc' },
    take: 10,
    select: { id: true, title: true, publisherCampaign: true, updatedAt: true },
  })

  return NextResponse.json({ data: posts })
}
