import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { calculateGeoScore } from '@/lib/seo/geo-scorer'
import { generateSchema } from '@/lib/seo/schema-generator'
import { applyAutoInternalLinksToContent, suggestInternalLinks, summarizeInternalLinks } from '@/lib/seo/internal-linker'
import { requireRole } from '@/lib/security/auth'
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

function getSchemaObject(schemaMarkup: unknown) {
  if (!schemaMarkup || typeof schemaMarkup !== 'object' || Array.isArray(schemaMarkup)) {
    return {}
  }

  return schemaMarkup as Record<string, unknown>
}

function getRevisions(schemaMarkup: unknown): SymbolRevision[] {
  const value = getSchemaObject(schemaMarkup).revisions
  return Array.isArray(value) ? (value as SymbolRevision[]) : []
}

function revalidateSymbol(letter?: string | null, slug?: string | null) {
  revalidatePath('/dictionar')
  if (letter) revalidatePath(`/dictionar/${letter}`)
  if (letter && slug) revalidatePath(`/dictionar/${letter}/${slug}`)
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { response } = await requireRole('EDITOR')
  if (response) return response

  const { context, response: siteResponse } = await requireCurrentSiteResponse()
  if (siteResponse) return siteResponse
  if (!context) return NextResponse.json({ error: 'Active site configuration is missing' }, { status: 500 })

  try {
    const symbol = await prisma.symbolEntry.findFirst({ where: { id: params.id, siteId: context.site.id } })
    if (!symbol) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json({
      ...symbol,
      revisions: getRevisions(symbol.schemaMarkup),
      status: symbol.publishedAt ? 'PUBLISHED' : 'DRAFT',
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch symbol' }, { status: 500 })
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
    const existing = await prisma.symbolEntry.findFirst({ where: { id: params.id, siteId: context.site.id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const revisions = getRevisions(existing.schemaMarkup)
    const nextVersion = revisions.length > 0 ? revisions[revisions.length - 1].version + 1 : 1

    const newRevision: SymbolRevision = {
      version: nextVersion,
      savedAt: new Date().toISOString(),
      userId: session.user.id,
      name: existing.name,
      shortDefinition: existing.shortDefinition,
      fullContent: existing.fullContent,
      contentJson: existing.contentJson,
      metaTitle: existing.metaTitle,
      metaDescription: existing.metaDescription,
    }

    const updatedRevisions = [...revisions, newRevision].slice(-20)
    const nextName = String(body.name || existing.name)
    const nextLetter = nextName.charAt(0).toUpperCase()
    const nextSlug = String(body.slug || existing.slug)
    let nextContentHtml = sanitizeRichHtml(String(body.fullContent || existing.fullContent))
    let nextContentJson = body.contentJson || existing.contentJson
    const nextShortDefinition = String(body.shortDefinition || existing.shortDefinition)
    const nextMetaTitle = typeof body.metaTitle === 'string' ? body.metaTitle : existing.metaTitle
    const nextMetaDescription = typeof body.metaDescription === 'string' ? body.metaDescription : existing.metaDescription
    const seoSettings = context.seoSettings

    let autoInternalLinksInserted: Array<{ href: string; anchorText: string; title: string; targetType: string }> = []

    if (seoSettings?.enableAutoInternalLinks) {
      const suggestions = await suggestInternalLinks({
        siteId: context.site.id,
        title: nextName,
        slug: nextSlug,
        contentHtml: nextContentHtml,
        contentJson: nextContentJson,
        excludeSymbolId: params.id,
        limit: 5,
      })
      const autoLinked = applyAutoInternalLinksToContent({
        contentJson: nextContentJson,
        contentHtml: nextContentHtml,
        suggestions,
        maxLinks: 2,
      })
      nextContentJson = autoLinked.contentJson
      nextContentHtml = autoLinked.contentHtml
      autoInternalLinksInserted = autoLinked.inserted
    }

    const geo = calculateGeoScore(
      {
        postType: 'SYMBOL',
        name: nextName,
        title: nextName,
        shortDefinition: nextShortDefinition,
        contentHtml: nextContentHtml,
        contentJson: nextContentJson,
        metaTitle: nextMetaTitle,
        metaDescription: nextMetaDescription,
      },
      { name: session.user.name || null },
    )

    const schema = generateSchema(
      {
        postType: 'SYMBOL',
        name: nextName,
        slug: `dictionar/${nextLetter}/${nextSlug}`,
        shortDefinition: nextShortDefinition,
        metaTitle: nextMetaTitle,
        metaDescription: nextMetaDescription,
        contentHtml: nextContentHtml,
        contentJson: nextContentJson,
        directAnswer: geo.directAnswer,
      },
      { siteName: seoSettings?.siteName, siteUrl: seoSettings?.siteUrl },
      null,
      { speakableSections: geo.speakableSections },
    )

    const updateData: Prisma.SymbolEntryUpdateInput = {
      name: nextName,
      slug: nextSlug,
      shortDefinition: nextShortDefinition,
      fullContent: nextContentHtml,
      contentJson: (nextContentJson || {}) as Prisma.InputJsonValue,
      metaTitle: nextMetaTitle,
      metaDescription: nextMetaDescription,
      relatedSymbols: (body.relatedSymbols || []) as Prisma.InputJsonValue,
      publishedAt: body.status === 'PUBLISHED' ? new Date() : body.status === 'DRAFT' ? null : body.publishedAt,
      letter: nextLetter,
      geoScore: geo.score,
      schemaMarkup: ({
        ...getSchemaObject(existing.schemaMarkup),
        revisions: updatedRevisions,
        internalLinksUsed: summarizeInternalLinks(nextContentHtml).links,
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
    }

    const symbol = await prisma.symbolEntry.update({
      where: { id: params.id },
      data: updateData,
    })

    revalidateSymbol(symbol.letter, symbol.slug)
    return NextResponse.json({
      ...symbol,
      revisions: updatedRevisions,
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
    return NextResponse.json({ error: 'Failed to update symbol' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { context, response: siteResponse } = await requireCurrentSiteResponse()
  if (siteResponse) return siteResponse
  if (!context) return NextResponse.json({ error: 'Active site configuration is missing' }, { status: 500 })

  try {
    const symbol = await prisma.symbolEntry.findFirst({ where: { id: params.id, siteId: context.site.id } })
    if (!symbol) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await prisma.symbolEntry.delete({ where: { id: params.id } })
    revalidateSymbol(symbol.letter, symbol.slug)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete symbol' }, { status: 500 })
  }
}

