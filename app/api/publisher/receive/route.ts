import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getPublisherToken, timingSafeEqualString } from '@/lib/publisher/token'
import { processImage, generateAltText } from '@/lib/media/image-processor'
import { generateSlug } from '@/lib/utils'
import { calculateGeoScore } from '@/lib/seo/geo-scorer'
import { generateSchema } from '@/lib/seo/schema-generator'
import { sanitizeRichHtml } from '@/lib/security/html'
import { assertSafeRemoteUrl } from '@/lib/security/request'
import { requireCurrentSiteResponse } from '@/lib/sites/context'

type CategoryNode = {
  name: string
  slug: string
  parent?: CategoryNode | null
}

type FaqItem = { question: string; answer: string }

type ContentNode = {
  type: string
  content?: ContentNode[]
  attrs?: Record<string, unknown>
  text?: string
}

type ContentDoc = {
  type: 'doc'
  content: ContentNode[]
}

function slugToName(slug: string) {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase())
}

async function downloadImage(url: string) {
  const safeUrl = await assertSafeRemoteUrl(url)
  const res = await fetch(safeUrl, { redirect: 'follow' })
  if (!res.ok) throw new Error('Image download failed')
  const contentType = res.headers.get('content-type') || 'image/jpeg'
  const contentLength = Number(res.headers.get('content-length') || 0)
  if (contentLength > 10 * 1024 * 1024) throw new Error('Image too large')
  const buffer = Buffer.from(await res.arrayBuffer())
  if (buffer.length > 10 * 1024 * 1024) throw new Error('Image too large')
  return { buffer, contentType }
}

async function saveMediaFromUrl(url: string) {
  const { buffer, contentType } = await downloadImage(url)
  const processed = await processImage(buffer)

  const nameFromUrl = url.split('/').pop() || 'image'
  const nameWithoutExt = nameFromUrl.replace(/\.[^.]+$/, '')
  const slug = generateSlug(nameWithoutExt) || 'media'
  const baseName = `${Date.now()}-${slug}`
  const originalExt = (nameFromUrl.match(/\.([^.]+)$/) || [])[1] || ''

  const uploadDir = path.join(process.cwd(), 'public', 'media', 'uploads')
  await mkdir(uploadDir, { recursive: true })

  const webpName = `${baseName}.webp`
  const thumbName = `${baseName}-thumb.webp`
  const ogName = `${baseName}-og.webp`
  const origName = `${baseName}-orig${originalExt ? `.${originalExt}` : ''}`.replace(/\.\./g, '.')

  await Promise.all([
    writeFile(path.join(uploadDir, webpName), processed.webp),
    writeFile(path.join(uploadDir, thumbName), processed.thumbnail),
    writeFile(path.join(uploadDir, ogName), processed.ogImage),
    writeFile(path.join(uploadDir, origName), buffer),
  ])

  const altText = await generateAltText(nameWithoutExt)

  const media = await prisma.media.create({
    data: {
      filename: webpName,
      originalName: nameFromUrl,
      mimeType: contentType,
      size: buffer.length,
      width: processed.width,
      height: processed.height,
      url: `/media/uploads/${webpName}`,
      urlOriginal: `/media/uploads/${origName}`,
      altText: altText || null,
    },
  })

  return media
}

function stripHtml(input: string) {
  return input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function buildContentJson(contentHtml: string, faqItems: FaqItem[]): ContentDoc {
  const text = stripHtml(contentHtml || '')
  const doc: ContentDoc = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: text ? [{ type: 'text', text }] : [],
      },
    ],
  }

  if (faqItems && faqItems.length > 0) {
    doc.content.push({
      type: 'faqBlock',
      attrs: { payload: { items: faqItems } },
    })
  }

  return doc
}

export async function POST(req: Request) {
  const headerToken = req.headers.get('X-CMS-Token') || ''
  const token = await getPublisherToken()
  if (!token || !timingSafeEqualString(headerToken, token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { context, response: siteResponse } = await requireCurrentSiteResponse()
  if (siteResponse) return siteResponse
  if (!context) return NextResponse.json({ error: 'Active site configuration is missing' }, { status: 500 })

  const body = await req.json()
  const statusInput = String(body.status || '').toUpperCase()
  const postType = (body.postType || 'DREAM_INTERPRETATION') as 'ARTICLE' | 'DREAM_INTERPRETATION' | 'SYMBOL'
  const pageType = (body.pageType || 'CONTENT') as 'CONTENT' | 'LANDING' | 'HUB' | 'SUPPORT'
  const templateType = (body.templateType || (postType === 'DREAM_INTERPRETATION' ? 'DREAM' : postType === 'SYMBOL' ? 'SYMBOL' : 'ARTICLE')) as 'ARTICLE' | 'DREAM' | 'SYMBOL' | 'HUB' | 'GUIDE' | 'LANDING'
  const verticalType = (body.verticalType || (postType === 'SYMBOL' ? 'SYMBOLS' : 'DREAMS')) as 'DREAMS' | 'SYMBOLS' | 'ANGEL_NUMBERS' | 'GENERIC'

  const categorySlug = String(body.categorySlug || '').trim()
  let category: CategoryNode | null = null
  if (categorySlug) {
    const found = await prisma.category.findFirst({
      where: { slug: categorySlug, siteId: context.site.id },
      include: { parent: true },
    })
    if (found) {
      category = { name: found.name, slug: found.slug, parent: found.parent ? { name: found.parent.name, slug: found.parent.slug } : null }
    } else {
      const created = await prisma.category.create({
        data: {
          siteId: context.site.id,
          name: slugToName(categorySlug),
          slug: categorySlug,
        },
      })
      category = { name: created.name, slug: created.slug, parent: null }
    }
  }

  let media = null
  if (body.featuredImageUrl) {
    try {
      media = await saveMediaFromUrl(String(body.featuredImageUrl))
    } catch {
      media = null
    }
  }

  const contentHtml = sanitizeRichHtml(String(body.contentHtml || ''))
  const faqItems = Array.isArray(body.faqItems) ? (body.faqItems as FaqItem[]) : []
  const contentJson = buildContentJson(contentHtml, faqItems)

  const seoSettings = context.seoSettings
  const author = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
  if (!author) return NextResponse.json({ error: 'Missing author' }, { status: 400 })

  const geo = calculateGeoScore(
    {
      title: body.title,
      name: body.title,
      postType,
      focusKeyword: body.focusKeyword || null,
      metaTitle: body.metaTitle || null,
      metaDescription: body.metaDescription || null,
      contentHtml,
      contentJson,
      shortDefinition: null,
    },
    { name: author.name || null },
  )

  const schema = generateSchema(
    {
      title: body.title,
      slug: `${categorySlug ? `${categorySlug}/` : ''}${body.slug}`,
      excerpt: body.metaDescription || '',
      contentHtml,
      contentJson,
      postType,
      metaTitle: body.metaTitle || null,
      metaDescription: body.metaDescription || null,
      focusKeyword: body.focusKeyword || null,
      author: { name: author.name },
    },
    { siteName: seoSettings?.siteName, siteUrl: seoSettings?.siteUrl },
    category,
    { speakableSections: geo.speakableSections },
  )

  const existing = body.publisherPageId
    ? await prisma.post.findFirst({ where: { publisherPageId: String(body.publisherPageId), siteId: context.site.id } })
    : null

  const categoryId = category
    ? (await prisma.category.findFirst({ where: { slug: category.slug, siteId: context.site.id }, select: { id: true } }))?.id || null
    : null

  const baseData: Prisma.PostUncheckedCreateInput = {
    siteId: context.site.id,
    title: String(body.title || ''),
    slug: String(body.slug || ''),
    contentHtml,
    contentJson: contentJson as Prisma.InputJsonValue,
    metaDescription: body.metaDescription || null,
    metaTitle: body.metaTitle || null,
    focusKeyword: body.focusKeyword || null,
    schemaMarkup: schema as Prisma.InputJsonValue,
    geoScore: geo.score,
    geoBreakdown: geo.breakdown as Prisma.InputJsonValue,
    speakableSections: geo.speakableSections as Prisma.InputJsonValue,
    directAnswer: geo.directAnswer,
    categoryId,
    authorId: author.id,
    postType,
    pageType,
    templateType,
    verticalType,
    status: statusInput === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
    publishedAt: statusInput === 'PUBLISHED' ? new Date() : null,
    featuredImageId: media?.id || null,
    publisherPageId: body.publisherPageId || null,
    publisherCampaign: body.publisherCampaign || null,
    sourceType: 'publisher',
  }

  let post
  if (existing) {
    post = await prisma.post.update({ where: { id: existing.id }, data: baseData })
  } else {
    post = await prisma.post.create({ data: baseData })
  }

  if (post.status === 'PUBLISHED' && categorySlug) {
    revalidatePath('/')
    revalidatePath('/dictionar')
    revalidatePath(`/${categorySlug}`)
    revalidatePath(`/${categorySlug}/${post.slug}`)
  }

  const siteUrl = (seoSettings?.siteUrl || context.site.siteUrl || 'https://candvisam.ro').replace(/\/$/, '')
  const url = categorySlug ? `${siteUrl}/${categorySlug}/${post.slug}` : `${siteUrl}/${post.slug}`

  return NextResponse.json({ success: true, postId: post.id, url, revalidated: true })
}




