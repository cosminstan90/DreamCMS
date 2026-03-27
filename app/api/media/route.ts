import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/security/auth'
import { clampInteger } from '@/lib/security/request'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const { response } = await requireRole('EDITOR')
  if (response) return response

  const { searchParams } = new URL(req.url)
  const page = clampInteger(parseInt(searchParams.get('page') || '1', 10), 1, 500)
  const limit = clampInteger(parseInt(searchParams.get('limit') || '40', 10), 1, 100)
  const type = searchParams.get('type')
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = {}
  if (type === 'image') {
    where.mimeType = { contains: 'image' }
  }

  const [data, total] = await Promise.all([
    prisma.media.findMany({ where, orderBy: { uploadedAt: 'desc' }, skip, take: limit }),
    prisma.media.count({ where }),
  ])

  const enriched = data.map((item) => {
    const base = item.url?.replace('/media/uploads/', '').replace('.webp', '') || ''
    const thumbUrl = item.url ? item.url.replace(/\.webp$/, '-thumb.webp').replace(/\.thumb\.webp$/, '-thumb.webp') : null
    const ogUrl = item.url ? item.url.replace(/\.webp$/, '-og.webp').replace(/\.og\.webp$/, '-og.webp') : null
    return {
      ...item,
      urls: {
        webp: item.url,
        thumbnail: thumbUrl,
        ogImage: ogUrl,
        original: item.urlOriginal,
      },
      base,
    }
  })

  return NextResponse.json({ data: enriched, total, page, limit })
}
