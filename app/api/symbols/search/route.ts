import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCurrentSiteResponse } from '@/lib/sites/context'

export async function GET(req: Request) {
  const { context, response } = await requireCurrentSiteResponse()
  if (response || !context) return response

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  const limit = parseInt(searchParams.get('limit') || '40', 10)

  if (!q) return NextResponse.json({ data: [] })

  const likeQuery = `%${q}%`

  const rows = await prisma.$queryRaw<Array<{ id: string; name: string; slug: string; shortDefinition: string; letter: string }>>`
    SELECT id, name, slug, shortDefinition, letter
    FROM SymbolEntry
    WHERE siteId = ${context.site.id}
      AND (name LIKE ${likeQuery} OR shortDefinition LIKE ${likeQuery})
      AND publishedAt IS NOT NULL
    ORDER BY letter ASC, name ASC
    LIMIT ${limit}
  `

  return NextResponse.json({ data: rows })
}
