import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/utils'
import { requireRole } from '@/lib/security/auth'
import { clampInteger } from '@/lib/security/request'
import { requireCurrentSiteResponse } from '@/lib/sites/context'

export async function GET(req: Request) {
  const { response } = await requireRole('EDITOR')
  if (response) return response

  const { context, response: siteResponse } = await requireCurrentSiteResponse()
  if (siteResponse) return siteResponse
  if (!context) return NextResponse.json({ error: 'Active site configuration is missing' }, { status: 500 })

  const { searchParams } = new URL(req.url)
  const page = clampInteger(parseInt(searchParams.get('page') || '1', 10), 1, 500)
  const limit = clampInteger(parseInt(searchParams.get('limit') || '100', 10), 1, 200)
  const skip = (page - 1) * limit

  try {
    const categories = await prisma.category.findMany({
      where: { siteId: context.site.id },
      skip,
      take: limit,
      include: {
        _count: { select: { posts: true } },
        children: {
          include: { _count: { select: { posts: true } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    const total = await prisma.category.count({ where: { siteId: context.site.id } })
    return NextResponse.json({ data: categories, total, page, limit })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { context, response: siteResponse } = await requireCurrentSiteResponse()
  if (siteResponse) return siteResponse
  if (!context) return NextResponse.json({ error: 'Active site configuration is missing' }, { status: 500 })

  try {
    const { name, description, metaTitle, metaDesc, parentId, sortOrder } = await req.json()
    if (!name) return NextResponse.json({ error: 'Numele este obligatoriu' }, { status: 400 })

    const generatedSlug = generateSlug(name)
    const parent = parentId
      ? await prisma.category.findFirst({ where: { id: parentId, siteId: context.site.id }, select: { id: true } })
      : null

    const category = await prisma.category.create({
      data: {
        siteId: context.site.id,
        name,
        slug: generatedSlug,
        description,
        metaTitle,
        metaDesc,
        parentId: parent?.id || null,
        sortOrder: sortOrder || 0,
      },
    })

    revalidatePath('/')
    revalidatePath(`/${category.slug}`)
    return NextResponse.json(category, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Slug deja existent pe acest site. Incearca alt nume.' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

