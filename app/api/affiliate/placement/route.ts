import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const productIds: string[] = Array.isArray(body.productIds)
      ? body.productIds.filter((id: unknown): id is string => typeof id === 'string')
      : []
    const pagePath = typeof body.pagePath === 'string' ? body.pagePath : ''
    const templateType = typeof body.templateType === 'string' ? body.templateType : 'article'

    if (!productIds.length || !pagePath) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    await prisma.affiliatePlacement.createMany({
      data: productIds.map((id: string) => ({ productId: id, pagePath, templateType })),
      skipDuplicates: false,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to record placement' }, { status: 500 })
  }
}
