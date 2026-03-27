import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireCurrentSiteResponse } from '@/lib/sites/context'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export async function GET() {
  const { context, response } = await requireCurrentSiteResponse()
  if (response || !context) return response

  try {
    const symbols = await prisma.symbolEntry.findMany({
      where: { siteId: context.site.id, publishedAt: { not: null } },
      select: { id: true, name: true, slug: true, shortDefinition: true, letter: true },
      orderBy: [{ letter: 'asc' }, { name: 'asc' }],
    })

    const grouped: Record<string, Array<{ id: string; name: string; slug: string; shortDefinition: string; letter: string }>> = {}
    for (const letter of LETTERS) grouped[letter] = []

    for (const symbol of symbols) {
      const key = symbol.letter.toUpperCase()
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(symbol)
    }

    for (const letter of Object.keys(grouped)) {
      grouped[letter] = grouped[letter].sort((a, b) => a.name.localeCompare(b.name, 'ro'))
    }

    return NextResponse.json(grouped)
  } catch {
    return NextResponse.json({ error: 'Failed to build symbol index' }, { status: 500 })
  }
}
