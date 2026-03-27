import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { requireCurrentSiteResponse } from '@/lib/sites/context'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { context, response: siteResponse } = await requireCurrentSiteResponse()
  if (siteResponse) return siteResponse
  if (!context) return NextResponse.json({ error: 'Active site configuration is missing' }, { status: 500 })

  try {
    const body = await req.json()
    const existing = await prisma.category.findFirst({ where: { id: params.id, siteId: context.site.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const parent = body.parentId
      ? await prisma.category.findFirst({ where: { id: body.parentId, siteId: context.site.id }, select: { id: true } })
      : null

    const category = await prisma.category.update({
      where: { id: params.id },
      data: {
        name: body.name,
        slug: body.slug,
        description: body.description,
        metaTitle: body.metaTitle,
        metaDesc: body.metaDesc,
        parentId: parent?.id || null,
        sortOrder: body.sortOrder ?? 0,
      },
    })

    revalidatePath('/')
    revalidatePath(`/${existing.slug}`)
    revalidatePath(`/${category.slug}`)
    return NextResponse.json(category)
  } catch {
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { context, response: siteResponse } = await requireCurrentSiteResponse()
  if (siteResponse) return siteResponse
  if (!context) return NextResponse.json({ error: 'Active site configuration is missing' }, { status: 500 })

  try {
    const category = await prisma.category.findFirst({
      where: { id: params.id, siteId: context.site.id },
      include: {
        _count: {
          select: {
            posts: true,
            children: true,
          },
        },
      },
    })

    if (!category) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (category._count.posts > 0) {
      return NextResponse.json({ error: 'Nu poti sterge o categorie care are articole atasate.' }, { status: 400 })
    }

    if (category._count.children > 0) {
      return NextResponse.json({ error: 'Nu poti sterge o categorie care are subcategorii.' }, { status: 400 })
    }

    await prisma.category.delete({ where: { id: params.id } })
    revalidatePath('/')
    revalidatePath(`/${category.slug}`)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}

