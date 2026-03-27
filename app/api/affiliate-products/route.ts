import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/utils'

function parseJsonArray(value: unknown) {
  if (Array.isArray(value)) return value.filter((entry): entry is string => typeof entry === 'string')
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }
  return []
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = parseInt(searchParams.get('limit') || '20', 10)
  const search = searchParams.get('search')
  const active = searchParams.get('active')
  const skip = (page - 1) * limit

  const where: Prisma.AffiliateProductWhereInput = {}
  if (search) {
    where.OR = [{ title: { contains: search } }, { merchant: { contains: search } }, { category: { contains: search } }]
  }
  if (active === 'true') where.active = true
  if (active === 'false') where.active = false

  const [data, total, clicks, placements] = await Promise.all([
    prisma.affiliateProduct.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
    }),
    prisma.affiliateProduct.count({ where }),
    prisma.affiliateClickLog.groupBy({ by: ['productId'], _count: { _all: true } }),
    prisma.affiliatePlacement.groupBy({ by: ['productId'], _count: { _all: true } }),
  ])

  const clicksMap = new Map(clicks.map((entry) => [entry.productId, entry._count._all]))
  const placementsMap = new Map(placements.map((entry) => [entry.productId, entry._count._all]))
  const enriched = data.map((product) => ({
    ...product,
    clicks: clicksMap.get(product.id) || 0,
    placements: placementsMap.get(product.id) || 0,
  }))

  const topClicked = enriched
    .slice()
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5)
  const neverShown = enriched.filter((item) => item.placements === 0).slice(0, 5)

  return NextResponse.json({
    data: enriched,
    total,
    page,
    limit,
    insights: {
      topClicked,
      neverShown,
    },
  })
}

export async function POST(req: Request) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  try {
    const body = await req.json()
    if (!body.title || !body.affiliateUrl) {
      return NextResponse.json({ error: 'title and affiliateUrl are required' }, { status: 400 })
    }

    const slug = body.slug || generateSlug(body.title)
    const product = await prisma.affiliateProduct.create({
      data: {
        title: body.title,
        slug,
        merchant: body.merchant || null,
        network: body.network || null,
        affiliateUrl: body.affiliateUrl,
        image: body.image || null,
        priceText: body.priceText || null,
        badge: body.badge || null,
        category: body.category || null,
        active: typeof body.active === 'boolean' ? body.active : true,
        priority: Number.isFinite(body.priority) ? Number(body.priority) : 0,
        relatedKeywords: parseJsonArray(body.relatedKeywords) as unknown as Prisma.InputJsonValue,
        relatedSymbols: parseJsonArray(body.relatedSymbols) as unknown as Prisma.InputJsonValue,
        relatedCategories: parseJsonArray(body.relatedCategories) as unknown as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Slug existent' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
