import { NextResponse } from 'next/server'
import { unlink } from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/security/auth'

async function safeUnlink(filePath: string | null | undefined) {
  if (!filePath) return
  const baseDir = path.resolve(process.cwd(), 'public')
  const abs = path.resolve(baseDir, filePath.replace(/^\//, ''))
  if (!abs.startsWith(baseDir)) return
  try {
    await unlink(abs)
  } catch {
    // ignore missing
  }
}

function deriveVariants(url?: string | null) {
  if (!url) return []
  const thumb = url.replace(/\.webp$/, '-thumb.webp').replace(/\.thumb\.webp$/, '-thumb.webp')
  const og = url.replace(/\.webp$/, '-og.webp').replace(/\.og\.webp$/, '-og.webp')
  return [url, thumb, og]
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { response } = await requireRole('EDITOR')
  if (response) return response

  const media = await prisma.media.findUnique({ where: { id: params.id } })
  if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const used = await prisma.post.count({
    where: {
      OR: [{ featuredImageId: params.id }, { ogImageId: params.id }],
    },
  })

  if (used > 0) {
    return NextResponse.json({ error: 'Imagine folosita in articole. Inlocuieste-o inainte de stergere.' }, { status: 400 })
  }

  await prisma.media.delete({ where: { id: params.id } })

  const variantUrls = deriveVariants(media.url)
  for (const url of variantUrls) await safeUnlink(url)
  await safeUnlink(media.urlOriginal)

  return NextResponse.json({ success: true })
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { response } = await requireRole('EDITOR')
  if (response) return response

  const body = await req.json()
  const altText = typeof body.altText === 'string' ? body.altText : undefined
  const caption = typeof body.caption === 'string' ? body.caption : undefined

  const media = await prisma.media.update({
    where: { id: params.id },
    data: {
      altText: altText ?? undefined,
      caption: caption ?? undefined,
    },
  })

  return NextResponse.json(media)
}
