import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/utils'
import { requireCurrentSiteResponse } from '@/lib/sites/context'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { context, response } = await requireCurrentSiteResponse()
  if (response) return response
  if (!context) return NextResponse.json({ error: 'Active site configuration is missing' }, { status: 500 })

  const [clusters, opportunities, briefs] = await Promise.all([
    prisma.topicCluster.findMany({
      where: { siteId: context.site.id },
      include: {
        category: { select: { name: true, slug: true } },
        keywords: true,
        pillarPost: { select: { id: true, title: true, slug: true, category: { select: { slug: true } } } },
        _count: { select: { posts: true, opportunities: true, briefs: true, keywords: true } },
      },
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
    }),
    prisma.contentOpportunity.findMany({
      where: { siteId: context.site.id },
      include: {
        cluster: { select: { name: true, slug: true } },
        category: { select: { name: true, slug: true } },
        symbol: { select: { name: true, slug: true, letter: true } },
        post: { select: { title: true, slug: true, category: { select: { slug: true } } } },
      },
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
      take: 80,
    }),
    prisma.topicBrief.findMany({
      where: { siteId: context.site.id },
      include: {
        cluster: { select: { name: true, slug: true } },
        opportunity: { select: { name: true, status: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 40,
    }),
  ])

  return NextResponse.json({ clusters, opportunities, briefs })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { context, response } = await requireCurrentSiteResponse()
  if (response) return response
  if (!context) return NextResponse.json({ error: 'Active site configuration is missing' }, { status: 500 })

  const body = await req.json()
  if (!body?.name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const cluster = await prisma.topicCluster.create({
    data: {
      siteId: context.site.id,
      name: body.name,
      slug: body.slug || generateSlug(body.name),
      intent: body.intent || 'INFORMATIONAL',
      priority: body.priority || 'MEDIUM',
      status: body.status || 'PLANNING',
      monetizationPotential: Number(body.monetizationPotential || 50),
      geoPotential: Number(body.geoPotential || 50),
      difficulty: Number(body.difficulty || 50),
      description: body.description || null,
      pillarTitle: body.pillarTitle || null,
      pillarMetaTitle: body.pillarMetaTitle || null,
      pillarMetaDescription: body.pillarMetaDescription || null,
      categoryId: body.categoryId || null,
      createdById: session.user.id,
    },
  })

  return NextResponse.json(cluster, { status: 201 })
}
