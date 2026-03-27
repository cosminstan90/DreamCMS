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

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const product = await prisma.affiliateProduct.findUnique({ where: { id: params.id } })
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(product)
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  try {
    const body = await req.json()
    const existing = await prisma.affiliateProduct.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updated = await prisma.affiliateProduct.update({
      where: { id: params.id },
      data: {
        title: body.title ?? existing.title,
        slug: body.slug || (body.title ? generateSlug(body.title) : existing.slug),
        merchant: body.merchant ?? existing.merchant,
        network: body.network ?? existing.network,
        affiliateUrl: body.affiliateUrl ?? existing.affiliateUrl,
        image: body.image ?? existing.image,
        priceText: body.priceText ?? existing.priceText,
        badge: body.badge ?? existing.badge,
        category: body.category ?? existing.category,
        active: typeof body.active === 'boolean' ? body.active : existing.active,
        priority: Number.isFinite(body.priority) ? Number(body.priority) : existing.priority,
        relatedKeywords: parseJsonArray(body.relatedKeywords ?? existing.relatedKeywords) as unknown as Prisma.InputJsonValue,
        relatedSymbols: parseJsonArray(body.relatedSymbols ?? existing.relatedSymbols) as unknown as Prisma.InputJsonValue,
        relatedCategories: parseJsonArray(body.relatedCategories ?? existing.relatedCategories) as unknown as Prisma.InputJsonValue,
      },
    })

    return NextResponse.json(updated)
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Slug existent' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  try {
    await prisma.affiliateProduct.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
