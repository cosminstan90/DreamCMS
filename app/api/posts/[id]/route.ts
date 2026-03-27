import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { calculateGeoScore } from '@/lib/seo/geo-scorer'
import { generateSchema } from '@/lib/seo/schema-generator'
import { requireRole } from '@/lib/security/auth'
import { sanitizeRichHtml } from '@/lib/security/html'
import {
  applyAutoInternalLinksToContent,
  suggestInternalLinks,
  summarizeInternalLinks,
} from '@/lib/seo/internal-linker'
import { requireCurrentSiteResponse } from '@/lib/sites/context'

type PostRevision = {
  version: number
  savedAt: string
  userId: string
  title: string
  contentJson: unknown
  contentHtml: string
  metaTitle: string | null
  metaDescription: string | null
}

function revalidatePost(categorySlug?: string | null, slug?: string | null) {
  revalidatePath('/')
  if (categorySlug) revalidatePath(`/${categorySlug}`)
  if (categorySlug && slug) revalidatePath(`/${categorySlug}/${slug}`)
}

function inferTemplateType(postType: string | null | undefined, sourceType: string | null | undefined) {
  if (sourceType === 'HUB') return 'HUB'
  if (postType === 'DREAM_INTERPRETATION') return 'DREAM'
  if (postType === 'SYMBOL') return 'SYMBOL'
  return 'ARTICLE'
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { response } = await requireRole('EDITOR')
  if (response) return response

  const { context, response: siteResponse } = await requireCurrentSiteResponse()
  if (siteResponse) return siteResponse
  if (!context) return NextResponse.json({ error: 'Active site configuration is missing' }, { status: 500 })

  try {
    const post = await prisma.post.findFirst({
      where: { id: params.id, siteId: context.site.id },
      include: {
        category: true,
        author: { select: { id: true, name: true, email: true } },
        symbolEntries: true,
      },
    })

    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(post)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { session, response } = await requireRole('EDITOR')
  if (response || !session) return response

  const { context, response: siteResponse } = await requireCurrentSiteResponse()
  if (siteResponse) return siteResponse
  if (!context) return NextResponse.json({ error: 'Active site configuration is missing' }, { status: 500 })

  try {
    const body = await req.json()
    const existingPost = await prisma.post.findFirst({
      where: { id: params.id, siteId: context.site.id },
      include: { category: { select: { slug: true } } },
    })
    if (!existingPost) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const oldRevisions: PostRevision[] = Array.isArray(existingPost.revisions)
      ? (existingPost.revisions as PostRevision[])
      : []
    const newVersion = oldRevisions.length > 0 ? oldRevisions[oldRevisions.length - 1].version + 1 : 1

    const newRevisionRecord = {
      version: newVersion,
      savedAt: new Date().toISOString(),
      userId: session.user.id,
      title: existingPost.title,
      contentJson: existingPost.contentJson,
      contentHtml: existingPost.contentHtml,
      metaTitle: existingPost.metaTitle,
      metaDescription: existingPost.metaDescription,
    }

    const updatedRevisions = [...oldRevisions, newRevisionRecord].slice(-20)
    const nextCategoryId = typeof body.categoryId === 'string' || body.categoryId === null ? body.categoryId : existingPost.categoryId
    const nextCategory = nextCategoryId
      ? await prisma.category.findFirst({
          where: { id: nextCategoryId, siteId: context.site.id },
          include: {
            parent: {
              include: {
                parent: true,
              },
            },
          },
        })
      : null
    const seoSettings = context.seoSettings

    let mergedPost = {
      ...existingPost,
      ...body,
      categoryId: nextCategoryId,
      slug: body.slug || existingPost.slug,
      title: body.title || existingPost.title,
      contentHtml: sanitizeRichHtml(String(body.contentHtml ?? existingPost.contentHtml ?? '')),
      contentJson: body.contentJson ?? existingPost.contentJson,
      postType: body.postType || existingPost.postType,
      pageType: body.pageType || existingPost.pageType || (body.sourceType === 'HUB' ? 'HUB' : 'CONTENT'),
      templateType:
        body.templateType ||
        existingPost.templateType ||
        inferTemplateType(body.postType || existingPost.postType, body.sourceType || existingPost.sourceType),
      verticalType: body.verticalType || existingPost.verticalType || 'DREAMS',
      focusKeyword: body.focusKeyword ?? existingPost.focusKeyword,
      excerpt: body.excerpt ?? existingPost.excerpt,
      metaTitle: body.metaTitle ?? existingPost.metaTitle,
      metaDescription: body.metaDescription ?? existingPost.metaDescription,
      author: { name: session.user.name || null },
    }

    let autoInternalLinksInserted: Array<{ href: string; anchorText: string; title: string; targetType: string }> = []

    if (seoSettings?.enableAutoInternalLinks) {
      const suggestions = await suggestInternalLinks({
        siteId: context.site.id,
        title: mergedPost.title,
        slug: mergedPost.slug,
        contentHtml: sanitizeRichHtml(String(mergedPost.contentHtml || '')),
        contentJson: mergedPost.contentJson,
        focusKeyword: mergedPost.focusKeyword,
        categoryId: mergedPost.categoryId,
        categorySlug: nextCategory?.slug || existingPost.category?.slug || null,
        postType: mergedPost.postType,
        excludePostId: params.id,
        limit: 5,
      })
      const autoLinked = applyAutoInternalLinksToContent({
        contentJson: mergedPost.contentJson,
        contentHtml: String(mergedPost.contentHtml || ''),
        suggestions,
        maxLinks: 2,
      })
      mergedPost = {
        ...mergedPost,
        contentJson: autoLinked.contentJson,
        contentHtml: autoLinked.contentHtml,
      }
      autoInternalLinksInserted = autoLinked.inserted
    }

    const geo = calculateGeoScore(mergedPost, { name: session.user.name || null })
    const schema = generateSchema(
      { ...mergedPost, directAnswer: geo.directAnswer },
      { siteName: seoSettings?.siteName, siteUrl: seoSettings?.siteUrl },
      (nextCategory as unknown) as { name: string; slug: string; parent?: { name: string; slug: string } | null } | null,
      { speakableSections: geo.speakableSections },
    )

    const post = await prisma.post.update({
      where: { id: params.id },
      data: {
        ...body,
        categoryId: nextCategory?.id || null,
        slug: mergedPost.slug,
        title: mergedPost.title,
        contentJson: mergedPost.contentJson as Prisma.InputJsonValue,
        contentHtml: String(mergedPost.contentHtml || ''),
        postType: mergedPost.postType,
        pageType: mergedPost.pageType,
        templateType: mergedPost.templateType,
        verticalType: mergedPost.verticalType,
        focusKeyword: mergedPost.focusKeyword,
        excerpt: mergedPost.excerpt,
        metaTitle: mergedPost.metaTitle,
        metaDescription: mergedPost.metaDescription,
        revisions: updatedRevisions as Prisma.InputJsonValue,
        geoScore: geo.score,
        geoBreakdown: geo.breakdown as Prisma.InputJsonValue,
        directAnswer: geo.directAnswer,
        speakableSections: geo.speakableSections as Prisma.InputJsonValue,
        schemaMarkup: schema as Prisma.InputJsonValue,
        internalLinksUsed: summarizeInternalLinks(String(mergedPost.contentHtml || '')).links as Prisma.InputJsonValue,
      },
      include: { category: { select: { slug: true } } },
    })

    revalidatePost(post.category?.slug || existingPost.category?.slug || null, post.slug)
    return NextResponse.json({
      ...post,
      geoScore: geo.score,
      geoBreakdown: geo.breakdown,
      speakableSections: geo.speakableSections,
      directAnswer: geo.directAnswer,
      geoSuggestions: geo.suggestions,
      geoWarnings: geo.warnings,
      snippetCandidates: geo.snippetCandidates,
      llmSummary: geo.llmSummary,
      citationReadiness: geo.citationReadiness,
      answerQualityLevel: geo.answerQualityLevel,
      aiCitability: geo.aiCitability,
      autoInternalLinksInserted,
    })
  } catch {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { context, response: siteResponse } = await requireCurrentSiteResponse()
  if (siteResponse) return siteResponse
  if (!context) return NextResponse.json({ error: 'Active site configuration is missing' }, { status: 500 })

  try {
    const post = await prisma.post.findFirst({ where: { id: params.id, siteId: context.site.id }, include: { category: { select: { slug: true } } } })
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (post.status !== 'DRAFT' && post.status !== 'ARCHIVED') {
      return NextResponse.json({ error: 'Poti sterge doar articole in stadiu DRAFT sau ARCHIVED' }, { status: 400 })
    }

    await prisma.post.delete({ where: { id: params.id } })
    revalidatePost(post.category?.slug || null, post.slug)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

