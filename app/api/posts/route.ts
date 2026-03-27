import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/utils'
import {
  applyAutoInternalLinksToContent,
  suggestInternalLinks,
  summarizeInternalLinks,
} from '@/lib/seo/internal-linker'
import { calculateGeoScore } from '@/lib/seo/geo-scorer'
import { generateSchema } from '@/lib/seo/schema-generator'
import { requireRole } from '@/lib/security/auth'
import { clampInteger } from '@/lib/security/request'
import { sanitizeRichHtml } from '@/lib/security/html'
import { requireCurrentSiteResponse } from '@/lib/sites/context'

function revalidatePublicPaths(categorySlug?: string | null, postSlug?: string | null) {
  revalidatePath('/')
  revalidatePath('/dictionar')
  if (categorySlug) revalidatePath(`/${categorySlug}`)
  if (categorySlug && postSlug) revalidatePath(`/${categorySlug}/${postSlug}`)
}

function inferTemplateType(postType: string | null | undefined, sourceType: string | null | undefined) {
  if (sourceType === 'HUB') return 'HUB'
  if (postType === 'DREAM_INTERPRETATION') return 'DREAM'
  if (postType === 'SYMBOL') return 'SYMBOL'
  return 'ARTICLE'
}

export async function GET(req: Request) {
  const { response } = await requireRole('EDITOR')
  if (response) return response

  const { context, response: siteResponse } = await requireCurrentSiteResponse()
  if (siteResponse) return siteResponse
  if (!context) return NextResponse.json({ error: 'Active site configuration is missing' }, { status: 500 })

  const { searchParams } = new URL(req.url)
  const page = clampInteger(parseInt(searchParams.get('page') || '1', 10), 1, 500)
  const limit = clampInteger(parseInt(searchParams.get('limit') || '20', 10), 1, 100)
  const status = searchParams.get('status')
  const categoryId = searchParams.get('categoryId')
  const postType = searchParams.get('postType')
  const search = searchParams.get('search')

  const skip = (page - 1) * limit
  const where: Record<string, unknown> = { siteId: context.site.id }

  if (status) where.status = status
  if (categoryId) where.categoryId = categoryId
  if (postType) where.postType = postType
  if (search) {
    where.OR = [{ title: { contains: search } }, { contentHtml: { contains: search } }]
  }

  try {
    const [data, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          category: { select: { name: true } },
          author: { select: { name: true, email: true } },
        },
      }),
      prisma.post.count({ where }),
    ])

    return NextResponse.json({ data, total, page, limit })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { session, response } = await requireRole('EDITOR')
  if (response || !session) return response

  const { context, response: siteResponse } = await requireCurrentSiteResponse()
  if (siteResponse) return siteResponse
  if (!context) return NextResponse.json({ error: 'Active site configuration is missing' }, { status: 500 })

  try {
    const body = await req.json()
    if (!body.title) {
      return NextResponse.json({ error: 'Titlul este obligatoriu' }, { status: 400 })
    }

    const slug = body.slug || generateSlug(body.title)
    const authorId = session.user.id
    const pageType = body.pageType || (body.sourceType === 'HUB' ? 'HUB' : 'CONTENT')
    const templateType = body.templateType || inferTemplateType(body.postType || 'ARTICLE', body.sourceType || null)
    const verticalType = body.verticalType || 'DREAMS'
    const [seoSettings, category] = await Promise.all([
      context.seoSettings,
      body.categoryId
        ? prisma.category.findFirst({
            where: { id: body.categoryId, siteId: context.site.id },
            include: { parent: { include: { parent: true } } },
          })
        : Promise.resolve(null),
    ])

    let contentJson = (body.contentJson || {}) as Prisma.InputJsonValue
    let contentHtml = sanitizeRichHtml(String(body.contentHtml || ''))
    let autoInternalLinksInserted: Array<{ href: string; anchorText: string; title: string; targetType: string }> = []

    if (seoSettings?.enableAutoInternalLinks) {
      const suggestions = await suggestInternalLinks({
        siteId: context.site.id,
        title: body.title,
        slug,
        contentHtml,
        contentJson: body.contentJson || {},
        focusKeyword: body.focusKeyword,
        categoryId: body.categoryId || null,
        categorySlug: category?.slug || null,
        postType: body.postType || 'ARTICLE',
        limit: 5,
      })
      const autoLinked = applyAutoInternalLinksToContent({
        contentJson: body.contentJson || {},
        contentHtml,
        suggestions,
        maxLinks: 2,
      })
      contentJson = autoLinked.contentJson as Prisma.InputJsonValue
      contentHtml = autoLinked.contentHtml
      autoInternalLinksInserted = autoLinked.inserted
    }

    const geo = calculateGeoScore(
      {
        title: body.title,
        slug,
        contentJson,
        contentHtml,
        postType: body.postType || 'ARTICLE',
        focusKeyword: body.focusKeyword,
        excerpt: body.excerpt,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
      },
      { name: session.user.name || null },
    )

    const schema = generateSchema(
      {
        title: body.title,
        slug: category?.slug ? `${category.slug}/${slug}` : slug,
        excerpt: body.excerpt,
        contentJson,
        contentHtml,
        postType: body.postType || 'ARTICLE',
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        author: { name: session.user.name || null },
        focusKeyword: body.focusKeyword,
        directAnswer: geo.directAnswer,
      },
      { siteName: seoSettings?.siteName, siteUrl: seoSettings?.siteUrl },
      (category as unknown) as { name: string; slug: string; parent?: { name: string; slug: string } | null } | null,
      { speakableSections: geo.speakableSections },
    )

    const initialRevision = [
      {
        version: 1,
        savedAt: new Date().toISOString(),
        userId: authorId,
        title: body.title,
        contentJson,
        contentHtml,
        metaTitle: body.metaTitle || '',
        metaDescription: body.metaDescription || '',
      },
    ]

    const post = await prisma.post.create({
      data: {
        siteId: context.site.id,
        title: body.title,
        slug,
        contentJson,
        contentHtml,
        status: body.status || 'DRAFT',
        postType: body.postType || 'ARTICLE',
        pageType,
        templateType,
        verticalType,
        authorId,
        revisions: initialRevision as Prisma.InputJsonValue,
        categoryId: category?.id || null,
        excerpt: body.excerpt,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        focusKeyword: body.focusKeyword,
        featuredImageId: body.featuredImageId || null,
        geoScore: geo.score,
        geoBreakdown: geo.breakdown as Prisma.InputJsonValue,
        directAnswer: geo.directAnswer,
        speakableSections: geo.speakableSections as Prisma.InputJsonValue,
        schemaMarkup: schema as Prisma.InputJsonValue,
        internalLinksUsed: summarizeInternalLinks(contentHtml).links as Prisma.InputJsonValue,
      },
      include: { category: { select: { slug: true } } },
    })

    revalidatePublicPaths(post.category?.slug || null, post.slug)
    return NextResponse.json({
      ...post,
      geoScore: geo.score,
      geoBreakdown: geo.breakdown,
      directAnswer: geo.directAnswer,
      speakableSections: geo.speakableSections,
      geoSuggestions: geo.suggestions,
      geoWarnings: geo.warnings,
      snippetCandidates: geo.snippetCandidates,
      llmSummary: geo.llmSummary,
      citationReadiness: geo.citationReadiness,
      answerQualityLevel: geo.answerQualityLevel,
      aiCitability: geo.aiCitability,
      autoInternalLinksInserted,
    }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Slug existent pe acest site' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

