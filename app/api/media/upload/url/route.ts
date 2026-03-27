import { NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { processImage, generateAltText } from '@/lib/media/image-processor'
import { generateSlug } from '@/lib/utils'
import { requireRole } from '@/lib/security/auth'
import { assertSafeRemoteUrl } from '@/lib/security/request'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

async function downloadBuffer(url: string) {
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) throw new Error('Download failed')
  const contentType = res.headers.get('content-type') || ''
  if (!ALLOWED_TYPES.some((type) => contentType.includes(type.replace('image/', '')))) {
    throw new Error('Invalid type')
  }
  const contentLength = Number(res.headers.get('content-length') || 0)
  if (contentLength > MAX_UPLOAD_BYTES) throw new Error('File too large')
  const buffer = Buffer.from(await res.arrayBuffer())
  if (buffer.length > MAX_UPLOAD_BYTES) throw new Error('File too large')
  return { buffer, contentType }
}

async function saveBuffers(baseName: string, originalExt: string, buffers: { webp: Buffer; thumbnail: Buffer; ogImage: Buffer; original: Buffer }) {
  const uploadDir = path.join(process.cwd(), 'public', 'media', 'uploads')
  await mkdir(uploadDir, { recursive: true })

  const paths = {
    webp: path.join(uploadDir, `${baseName}.webp`),
    thumbnail: path.join(uploadDir, `${baseName}-thumb.webp`),
    ogImage: path.join(uploadDir, `${baseName}-og.webp`),
    original: path.join(uploadDir, `${baseName}-orig${originalExt ? `.${originalExt}` : ''}`.replace(/\.\./g, '.')),
  }

  await Promise.all([
    writeFile(paths.webp, buffers.webp),
    writeFile(paths.thumbnail, buffers.thumbnail),
    writeFile(paths.ogImage, buffers.ogImage),
    writeFile(paths.original, buffers.original),
  ])

  return paths
}

function buildUrls(baseName: string, originalExt: string) {
  return {
    webp: `/media/uploads/${baseName}.webp`,
    thumbnail: `/media/uploads/${baseName}-thumb.webp`,
    ogImage: `/media/uploads/${baseName}-og.webp`,
    original: `/media/uploads/${baseName}-orig${originalExt ? `.${originalExt}` : ''}`.replace(/\.\./g, '.'),
  }
}

export async function POST(req: Request) {
  const { response } = await requireRole('EDITOR')
  if (response) return response

  try {
    const body = await req.json()
    const url = await assertSafeRemoteUrl(String(body?.url || '').trim())
    if (!url) return NextResponse.json({ error: 'URL lipsa' }, { status: 400 })

    const { buffer, contentType } = await downloadBuffer(url)
    const processed = await processImage(buffer)

    const nameFromUrl = url.split('/').pop() || 'image'
    const nameWithoutExt = nameFromUrl.replace(/\.[^.]+$/, '')
    const originalExt = (nameFromUrl.match(/\.([^.]+)$/) || [])[1] || ''
    const slug = generateSlug(nameWithoutExt) || 'media'
    const baseName = `${Date.now()}-${slug}`

    await saveBuffers(baseName, originalExt, { webp: processed.webp, thumbnail: processed.thumbnail, ogImage: processed.ogImage, original: buffer })
    const urls = buildUrls(baseName, originalExt)

    const altText = await generateAltText(nameWithoutExt)

    const media = await prisma.media.create({
      data: {
        filename: `${baseName}.webp`,
        originalName: nameFromUrl,
        mimeType: contentType || 'image/webp',
        size: buffer.length,
        width: processed.width,
        height: processed.height,
        url: urls.webp,
        urlOriginal: urls.original,
        altText: altText || null,
      },
    })

    return NextResponse.json({ media: { ...media, urls } })
  } catch {
    return NextResponse.json({ error: 'Download esuat' }, { status: 400 })
  }
}
