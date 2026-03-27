import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { requireCurrentSiteResponse } from '@/lib/sites/context'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { context, response: siteResponse } = await requireCurrentSiteResponse()
  if (siteResponse) return siteResponse
  if (!context) return NextResponse.json({ error: 'Active site configuration is missing' }, { status: 500 })

  try {
    const existing = await prisma.post.findFirst({ where: { id: params.id, siteId: context.site.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const post = await prisma.post.update({
      where: { id: params.id },
      data: { status: 'DRAFT', publishedAt: null },
      include: { category: { select: { slug: true } } },
    })

    revalidatePath('/')
    if (post.category?.slug) revalidatePath(`/${post.category.slug}`)
    if (post.category?.slug) revalidatePath(`/${post.category.slug}/${post.slug}`)

    return NextResponse.json(post)
  } catch {
    return NextResponse.json({ error: 'Failed to unpublish post' }, { status: 500 })
  }
}

