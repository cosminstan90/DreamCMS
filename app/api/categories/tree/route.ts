import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/security/auth'
import { requireCurrentSiteResponse } from '@/lib/sites/context'

type TreeNode = {
  id: string
  parentId: string | null
  children: TreeNode[]
  [key: string]: unknown
}

export async function GET() {
  const { response } = await requireRole('EDITOR')
  if (response) return response

  const { context, response: siteResponse } = await requireCurrentSiteResponse()
  if (siteResponse) return siteResponse
  if (!context) return NextResponse.json({ error: 'Active site configuration is missing' }, { status: 500 })

  try {
    const categories = await prisma.category.findMany({
      where: { siteId: context.site.id },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { posts: true } } },
    })

    const categoryMap = new Map<string, TreeNode>()
    categories.forEach((cat) => categoryMap.set(cat.id, { ...cat, children: [] }))

    const tree: TreeNode[] = []

    categoryMap.forEach((cat) => {
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId)
        if (parent) parent.children.push(cat)
        else tree.push(cat)
      } else {
        tree.push(cat)
      }
    })

    return NextResponse.json(tree)
  } catch {
    return NextResponse.json({ error: 'Failed to generate tree' }, { status: 500 })
  }
}

