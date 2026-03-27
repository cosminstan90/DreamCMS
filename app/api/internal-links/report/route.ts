import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { countInternalLinks } from '@/lib/seo/content-audit'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const posts = await prisma.post.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      updatedAt: true,
      category: { select: { slug: true, name: true } },
      contentHtml: true,
    },
    orderBy: { updatedAt: 'desc' },
    take: 250,
  })

  const rows = posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    status: post.status,
    updatedAt: post.updatedAt,
    category: post.category,
    linkCount: countInternalLinks(post.contentHtml || ''),
    url: post.category?.slug ? `/${post.category.slug}/${post.slug}` : `/${post.slug}`,
  }))

  return NextResponse.json({
    summary: {
      totalPosts: rows.length,
      noInternalLinks: rows.filter((row) => row.linkCount === 0).length,
      underTwoInternalLinks: rows.filter((row) => row.linkCount < 2).length,
      wellLinked: rows.filter((row) => row.linkCount >= 2).length,
    },
    noInternalLinks: rows.filter((row) => row.linkCount === 0).slice(0, 20),
    underTwoInternalLinks: rows.filter((row) => row.linkCount < 2).sort((a, b) => a.linkCount - b.linkCount).slice(0, 30),
    topPagesByInternalLinks: [...rows].sort((a, b) => b.linkCount - a.linkCount).slice(0, 15),
  })
}
