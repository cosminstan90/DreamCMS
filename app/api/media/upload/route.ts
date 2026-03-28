import { NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/prisma'
import { processImage, generateAltText } from '@/lib/media/image-processor'
import { generateSlug } from '@/lib/utils'
import { requireRole } from '@/lib/security/auth'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

async function saveBuffers(baseName: string, originalExt: string, buffers: { webp: Buffer; thumbnail: Buffer; ogImage: Buffer; original: Buffer }) {
  const uploadDir = path.join(process.cwd(), 'public', 'media', 'uploads')
  await mkdir(uploadDir, { recursive: true })

  const paths = {
    webp: path.join(uploadDir, `${baseName}.webp`),
    thumbnail: path.join(uploadDir, `${baseName}-thumb.webp`),
    ogImage: path.join(uploadDir, `${baseName}-og.webp`),
    original: path.join(uploadDir, `${baseName}-orig${originalExt ? `.${originalExt}` : ''}`),
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
    original: `/media/uploads/${baseName}-orig${originalExt ? `.${originalExt}` : ''}`,
  }
}

export async function POST(req: Request) {
  const { response } = await requireRole('EDITOR')
  if (response) return response

  const formData = await req.formData()
  const file = formData.get('file')

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Tip fisier neacceptat' }, { status: 400 })
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'Fisierul depaseste 10MB' }, { status: 400 })
  }

  const originalBuffer = Buffer.from(await file.arrayBuffer())
  const processed = await processImage(originalBuffer)

  const nameWithoutExt = (file.name || 'upload').replace(/\.[^.]+$/, '')
  const slug = generateSlug(nameWithoutExt) || 'media'
  const baseName = `${Date.now()}-${slug}`
  // Extract and sanitize extension — only alphanumeric chars, prevents any path traversal
  const originalExt = ((file.name.match(/\.([^.]+)$/) || [])[1] || '').toLowerCase().replace(/[^a-z0-9]/g, '')

  await saveBuffers(baseName, originalExt, { webp: processed.webp, thumbnail: processed.thumbnail, ogImage: processed.ogImage, original: originalBuffer })
  const urls = buildUrls(baseName, originalExt)

  const altText = await generateAltText(nameWithoutExt)

  const media = await prisma.media.create({
    data: {
      filename: `${baseName}.webp`,
      originalName: file.name,
      mimeType: file.type || 'image/webp',
      size: originalBuffer.length,
      width: processed.width,
      height: processed.height,
      url: urls.webp,
      urlOriginal: urls.original,
      altText: altText || null,
    },
  })

  return NextResponse.json({ media: { ...media, urls } })
}
