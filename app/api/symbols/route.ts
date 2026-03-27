import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/utils'
import { calculateGeoScore } from '@/lib/seo/geo-scorer'
import { generateSchema } from '@/lib/seo/schema-generator'
import { applyAutoInternalLinksToContent, suggestInternalLinks, summarizeInternalLinks } from '@/lib/seo/internal-linker'
import { requireRole } from '@/lib/security/auth'
import { clampInteger } from '@/lib/security/request'
import { sanitizeRichHtml } from '@/lib/security/html'
import { requireCurrentSiteResponse } from '@/lib/sites/context'

type SymbolRevision = {
  version: number
  savedAt: string
  userId: string
  name: string
  shortDefinition: string
  fullContent: string
  contentJson: unknown
  metaTitle?: string | null
  metaDescription?: string | null
}

function revalidateSymbol(letter?: string | null, slug?: string | null) {
  revalidatePath('/dictionar')
  if (letter) revalidatePath(`/dictionar/${letter}`)
  if (letter && slug) revalidatePath(`/dictionar/${letter}/${slug}`)
}

export async function GET(req: Request) {
  const { response } = await requireRole('EDITOR')
  if (response) return response

  const { context, response: siteResponse } = await requireCurrentSiteResponse()
  if (siteResponse) return siteResponse
  if (!context) return NextResponse.json({ error: 'Active site configuration is missing' }, { status: 500 })

  const { searchParams } = new URL(req.url)
  const page = clampInteger(parseInt(searchParams.get('page') || '1', 10), 1, 500)
  const limit = clampInteger(parseInt(searchParams.get('limit') || '50', 10), 1, 100)
  const letter = searchParams.get('letter')
  const search = searchParams.get('search')
  const skip = (page - 1) * limit

  const where: Record<string, unknown> = { siteId: context.site.id }
  if (letter) where.letter = letter.toUpperCase()
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { shortDefinition: { contains: search } },
      { fullContent: { contains: search } },
    ]
  }

  try {
    const [data, total] = await Promise.all([
      prisma.symbolEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ letter: 'asc' }, { updatedAt: 'desc' }],
      }),
      prisma.symbolEntry.count({ where }),
    ])

    return NextResponse.json({ data, total, page, limit })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch symbols' }, { status: 500 })
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
    const name = String(body.name || '').trim()

    if (!name) return NextResponse.json({ error: 'Numele este obligatoriu' }, { status: 400 })

    const slug = body.slug ? String(body.slug) : generateSlug(name)
    const letter = name.charAt(0).toUpperCase()
    const seoSettings = context.seoSettings

    let contentJson = body.contentJson || {}
    let fullContent = sanitizeRichHtml(String(body.fullContent || ''))
    let autoInternalLinksInserted: Array<{ href: string; anchorText: string; title: string; targetType: string }> = []

    if (seoSettings?.enableAutoInternalLinks) {
      const suggestions = await suggestInternalLinks({
        siteId: context.site.id,
        title: name,
        slug,
        contentHtml: fullContent,
        contentJson,
        limit: 5,
        excludeSymbolId: null,
      })
      const autoLinked = applyAutoInternalLinksToContent({
        contentJson,
        contentHtml: fullContent,
        suggestions,
        maxLinks: 2,
      })
      contentJson = autoLinked.contentJson
      fullContent = autoLinked.contentHtml
      autoInternalLinksInserted = autoLinked.inserted
    }

    const geo = calculateGeoScore(
      {
        postType: 'SYMBOL',
        name,
        title: name,
        shortDefinition: String(body.shortDefinition || ''),
        contentHtml: fullContent,
        contentJson,
        metaTitle: body.metaTitle || null,
        metaDescription: body.metaDescription || null,
      },
      { name: session.user.name || null },
    )

    const schema = generateSchema(
      {
        postType: 'SYMBOL',
        name,
        slug: `dictionar/${letter}/${slug}`,
        shortDefinition: String(body.shortDefinition || ''),
        metaTitle: body.metaTitle || null,
        metaDescription: body.metaDescription || null,
        contentHtml: fullContent,
        contentJson,
        directAnswer: geo.directAnswer,
      },
      { siteName: seoSettings?.siteName, siteUrl: seoSettings?.siteUrl },
      null,
      { speakableSections: geo.speakableSections },
    )

    const initialRevision: SymbolRevision = {
      version: 1,
      savedAt: new Date().toISOString(),
      userId: session.user.id,
      name,
      shortDefinition: String(body.shortDefinition || ''),
      fullContent,
      contentJson,
      metaTitle: body.metaTitle || null,
      metaDescription: body.metaDescription || null,
    }

    const symbol = await prisma.symbolEntry.create({
      data: {
        siteId: context.site.id,
        name,
        slug,
        letter,
        shortDefinition: String(body.shortDefinition || ''),
        fullContent,
        contentJson: contentJson as Prisma.InputJsonValue,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        schemaMarkup: ({
          revisions: [initialRevision],
          internalLinksUsed: summarizeInternalLinks(fullContent).links,
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
          schema,
        } as unknown) as Prisma.InputJsonValue,
        geoScore: geo.score,
        relatedSymbols: (body.relatedSymbols || []) as Prisma.InputJsonValue,
        publishedAt: body.publishedAt ? new Date(body.publishedAt) : body.status === 'PUBLISHED' ? new Date() : null,
      },
    })

    revalidateSymbol(symbol.letter, symbol.slug)
    return NextResponse.json({
      ...symbol,
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
    }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Slug deja existent pe acest site' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Failed to create symbol' }, { status: 500 })
  }
}

