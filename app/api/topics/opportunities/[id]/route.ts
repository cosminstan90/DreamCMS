import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { requireCurrentSiteResponse } from '@/lib/sites/context'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { context, response } = await requireCurrentSiteResponse()
  if (response) return response
  if (!context) return NextResponse.json({ error: 'Active site configuration is missing' }, { status: 500 })

  const body = await req.json()
  const existing = await prisma.contentOpportunity.findFirst({ where: { id: params.id, siteId: context.site.id }, select: { id: true } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.contentOpportunity.update({
    where: { id: params.id },
    data: {
      status: body.status,
      name: typeof body.name === 'string' ? body.name : undefined,
      summary: typeof body.summary === 'string' ? body.summary : undefined,
      recommendedTitle: typeof body.recommendedTitle === 'string' ? body.recommendedTitle : undefined,
      recommendedMeta: typeof body.recommendedMeta === 'string' ? body.recommendedMeta : undefined,
      monetizationPotential: typeof body.monetizationPotential === 'number' ? body.monetizationPotential : undefined,
      geoPotential: typeof body.geoPotential === 'number' ? body.geoPotential : undefined,
      difficulty: typeof body.difficulty === 'number' ? body.difficulty : undefined,
    },
  })

  return NextResponse.json(updated)
}
