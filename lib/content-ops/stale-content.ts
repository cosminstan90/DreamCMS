import { OpportunityStatus, Prisma, RefreshStatus, TopicPriority } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  countImagesMissingAlt,
  countInternalLinks,
  extractFirstParagraph,
  hasFaqBlock,
  wordCountFromHtml,
} from '@/lib/seo/content-audit'

type RefreshCandidate = {
  id: string
  siteId: string
  title: string
  slug: string
  postType: string
  status: string
  metaDescription: string | null
  focusKeyword: string | null
  geoScore: number | null
  directAnswer: string | null
  contentHtml: string
  contentJson: Prisma.JsonValue
  schemaMarkup: Prisma.JsonValue | null
  sourceType: string | null
  publishedAt: Date | null
  updatedAt: Date
  categoryId: string | null
  topicClusterId: string | null
  refreshStatus: RefreshStatus
  refreshNotes: string | null
  lastReviewedAt: Date | null
  category: { slug: string; name: string } | null
}

export type RefreshAnalysis = {
  ageDays: number
  wordCount: number
  linkCount: number
  missingImageAltCount: number
  contentDecayScore: number
  contentHealthScore: number
  refreshPriority: number
  recommendedStatus: RefreshStatus
  effectiveStatus: RefreshStatus
  reasons: string[]
  recommendedActions: string[]
  url: string
}

type RefreshRow = {
  id: string
  title: string
  slug: string
  postType: string
  status: string
  url: string
  category: { slug: string; name: string } | null
  refreshStatus: RefreshStatus
  refreshNotes: string | null
  lastReviewedAt: Date | null
  updatedAt: Date
  publishedAt: Date | null
  ageDays: number
  wordCount: number
  linkCount: number
  missingImageAltCount: number
  contentDecayScore: number
  contentHealthScore: number
  refreshPriority: number
  reasons: string[]
  recommendedActions: string[]
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

function daysSince(date: Date | null | undefined) {
  if (!date) return 999
  const diff = Date.now() - date.getTime()
  return Math.max(0, Math.round(diff / 86400000))
}

function safeJson<T>(value: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

function buildPublicUrl(post: RefreshCandidate) {
  return post.category?.slug ? `/${post.category.slug}/${post.slug}` : `/${post.slug}`
}

function mapPriority(score: number): TopicPriority {
  if (score >= 80) return 'CRITICAL'
  if (score >= 60) return 'HIGH'
  if (score >= 35) return 'MEDIUM'
  return 'LOW'
}

function mapRefreshToOpportunityStatus(status: RefreshStatus): OpportunityStatus {
  if (status === 'IN_REFRESH') return 'IN_PROGRESS'
  if (status === 'REFRESH_NEEDED') return 'REFRESH_NEEDED'
  if (status === 'WATCH') return 'READY_TO_WRITE'
  return 'PUBLISHED'
}

function buildOpportunityOutline(post: RefreshCandidate, analysis: RefreshAnalysis) {
  return [
    { heading: 'Raspuns rapid actualizat', goal: 'Rescrie primul paragraf astfel incat sa raspunda direct intentiei principale in maximum 60 de cuvinte.' },
    { heading: 'Context si interpretare', goal: 'Adauga detalii despre contextul emotional, variatiile simbolului si diferentele dintre sensul pozitiv si negativ.' },
    { heading: 'Suport SEO si GEO', goal: `Ridica GEO peste 60, creste linkurile interne peste 2 si acopera FAQ/schema unde lipsesc.` },
    { heading: 'Refresh editorial', goal: `Prioritate curenta ${analysis.refreshPriority}/100. Actualizeaza pagina ${post.title} cu exemple, surse si structura mai clara.` },
  ]
}

function buildOpportunityFaq(post: RefreshCandidate) {
  const subject = post.focusKeyword || post.title.toLowerCase()
  return [
    { question: `Ce inseamna ${subject} in vis?`, answer: 'Raspunsul trebuie actualizat clar si direct, fara introduceri lungi.' },
    { question: 'Ce context schimba sensul interpretarii?', answer: 'Adauga diferentele de context emotional, relatii si frecventa aparitiei in vis.' },
    { question: 'Cand merita sa revizuiesc aceasta interpretare?', answer: 'Revizuirea este utila cand articolul este vechi, are GEO slab sau nu raspunde direct intentiei.' },
  ]
}

export function calculateRefreshAnalysis(post: RefreshCandidate): RefreshAnalysis {
  const ageDays = daysSince(post.updatedAt || post.publishedAt)
  const wordCount = wordCountFromHtml(post.contentHtml || '')
  const linkCount = countInternalLinks(post.contentHtml || '')
  const hasFaq = hasFaqBlock(post.contentJson)
  const hasSchema = Boolean(post.schemaMarkup)
  const hasMeta = Boolean(post.metaDescription)
  const hasDirectAnswer = Boolean(post.directAnswer)
  const hasFocusKeyword = Boolean(post.focusKeyword)
  const geoScore = post.geoScore || 0
  const intro = extractFirstParagraph(post.contentHtml || '')
  const introWordCount = intro ? intro.split(/\s+/).filter(Boolean).length : 0
  const answerFirst = introWordCount > 0 && introWordCount <= 70 && (!post.focusKeyword || intro.toLowerCase().includes(post.focusKeyword.toLowerCase()))
  const missingImageAltCount = countImagesMissingAlt(post.contentHtml || '')

  let decay = 0
  let health = 100
  const reasons: string[] = []
  const recommendedActions: string[] = []

  if (ageDays >= 365) {
    decay += 24
    health -= 18
    reasons.push(`Pagina nu a mai fost revizuita de ${ageDays} zile.`)
    recommendedActions.push('Actualizeaza introducerea, exemplele si structura pentru intentia actuala a cautarii.')
  } else if (ageDays >= 180) {
    decay += 16
    health -= 10
    reasons.push(`Continutul are ${ageDays} zile fara refresh.`)
    recommendedActions.push('Fa un refresh editorial usor: direct answer, FAQ, exemple si linkuri noi.')
  } else if (ageDays >= 120) {
    decay += 8
    health -= 4
    reasons.push(`Articolul intra in fereastra de monitorizare (${ageDays} zile).`)
  }

  if (geoScore < 50) {
    decay += 18
    health -= 16
    reasons.push(`GEO score este critic (${geoScore}).`)
    recommendedActions.push('Adauga QuickAnswerBlock, FAQBlock si sectiuni mai citabile pentru LLM-uri.')
  } else if (geoScore < 65) {
    decay += 9
    health -= 8
    reasons.push(`GEO score este sub tinta (${geoScore}).`)
  }

  if (linkCount === 0) {
    decay += 18
    health -= 14
    reasons.push('Pagina nu are internal links.')
    recommendedActions.push('Insereaza minimum 2 linkuri interne relevante catre hub-uri, simboluri si articole suport.')
  } else if (linkCount < 2) {
    decay += 10
    health -= 8
    reasons.push(`Pagina are doar ${linkCount} link intern.`)
    recommendedActions.push('Ridica pagina peste pragul de 2 linkuri interne contextuale.')
  }

  if (!hasFaq) {
    decay += 10
    health -= 8
    reasons.push('Lipseste FAQ block.')
    recommendedActions.push('Adauga 3-5 intrebari frecvente pentru snippet-uri si AI answers.')
  }

  if (!hasSchema) {
    decay += 8
    health -= 6
    reasons.push('Schema markup lipseste sau este incompleta.')
    recommendedActions.push('Regenereaza schema si verifica blocurile vizibile care pot fi transpuse in JSON-LD.')
  }

  if (!hasDirectAnswer) {
    decay += 9
    health -= 8
    reasons.push('Pagina nu are direct answer salvat.')
    recommendedActions.push('Rescrie primul paragraf pentru a raspunde direct la intrebare.')
  }

  if (!answerFirst) {
    decay += 6
    health -= 5
    reasons.push('Intro-ul nu este answer-first.')
    recommendedActions.push('Scurteaza introducerea si include rapid sensul principal al visului sau simbolului.')
  }

  if (!hasMeta) {
    decay += 7
    health -= 6
    reasons.push('Meta description lipseste.')
    recommendedActions.push('Completeaza meta description cu intent clar si beneficii pentru CTR.')
  }

  if (!hasFocusKeyword) {
    decay += 5
    health -= 4
    reasons.push('Focus keyword lipseste.')
    recommendedActions.push('Seteaza un focus keyword principal pentru consistenta SEO si GEO.')
  }

  if (wordCount < 400) {
    decay += 12
    health -= 10
    reasons.push(`Continutul este prea scurt (${wordCount} cuvinte).`)
    recommendedActions.push('Extinde continutul cu context, interpretare psihologica, FAQ si links suport.')
  } else if (wordCount < 700) {
    decay += 5
    health -= 4
    reasons.push(`Continutul poate fi aprofundat (${wordCount} cuvinte).`)
  }

  if (missingImageAltCount > 0) {
    decay += Math.min(6, missingImageAltCount * 2)
    health -= Math.min(5, missingImageAltCount)
    reasons.push(`Exista ${missingImageAltCount} imagini fara alt text.`)
    recommendedActions.push('Completeaza alt text-urile pentru imagini si optimizeaza contextul semantic.')
  }

  if (post.sourceType === 'HUB') {
    decay += 4
    reasons.push('Hub pages cer refresh regulat pentru a ramane authoritative.')
    recommendedActions.push('Actualizeaza hub-ul cu pagini noi din cluster si legaturi spre suport pages.')
  }

  const contentDecayScore = clamp(Math.round(decay), 0, 100)
  const contentHealthScore = clamp(Math.round(health), 0, 100)
  const refreshPriority = clamp(
    Math.round(contentDecayScore * 0.6 + (100 - contentHealthScore) * 0.4 + (post.sourceType === 'HUB' ? 6 : 0)),
    0,
    100,
  )

  let recommendedStatus: RefreshStatus = 'FRESH'
  if (refreshPriority >= 70 || contentHealthScore <= 45) {
    recommendedStatus = 'REFRESH_NEEDED'
  } else if (refreshPriority >= 40) {
    recommendedStatus = 'WATCH'
  }

  let effectiveStatus: RefreshStatus = recommendedStatus
  if (post.refreshStatus === 'IN_REFRESH') {
    effectiveStatus = 'IN_REFRESH'
  } else if (post.refreshStatus === 'REFRESHED' && daysSince(post.lastReviewedAt) <= 45) {
    effectiveStatus = 'REFRESHED'
  } else if (post.refreshStatus === 'WATCH' && recommendedStatus === 'FRESH') {
    effectiveStatus = 'WATCH'
  }

  return {
    ageDays,
    wordCount,
    linkCount,
    missingImageAltCount,
    contentDecayScore,
    contentHealthScore,
    refreshPriority,
    recommendedStatus,
    effectiveStatus,
    reasons: unique(reasons),
    recommendedActions: unique(recommendedActions),
    url: buildPublicUrl(post),
  }
}

async function upsertStaleOpportunity(post: RefreshCandidate, analysis: RefreshAnalysis) {
  const slug = `stale-content-${post.slug}`
  const outline = buildOpportunityOutline(post, analysis)
  const faq = buildOpportunityFaq(post)
  const geoBlocks = unique([
    !post.directAnswer ? 'QuickAnswerBlock' : '',
    !hasFaqBlock(post.contentJson) ? 'FAQBlock' : '',
    'ExpertTakeBlock',
  ])
  const internalLinks = unique([
    post.category?.slug ? `/${post.category.slug}` : '',
    analysis.url,
  ]).map((url) => ({ label: url === analysis.url ? 'Pagina curenta' : 'Hub categorie', url, type: 'internal' }))

  await prisma.contentOpportunity.upsert({
    where: { siteId_slug: { siteId: post.siteId, slug } },
    update: {
      name: `Refresh content: ${post.title}`,
      intent: 'INFORMATIONAL',
      priority: mapPriority(analysis.refreshPriority),
      status: mapRefreshToOpportunityStatus(analysis.effectiveStatus),
      monetizationPotential: clamp(40 + Math.round((100 - analysis.contentHealthScore) * 0.25), 20, 85),
      geoPotential: clamp(45 + Math.round((100 - (post.geoScore || 0)) * 0.5), 25, 95),
      difficulty: clamp(20 + analysis.recommendedActions.length * 6, 20, 70),
      opportunityType: 'STALE_CONTENT',
      summary: analysis.reasons.join(' '),
      recommendedTitle: post.title,
      recommendedMeta: post.metaDescription || `Actualizeaza pagina ${post.title.toLowerCase()} pentru raspuns direct, FAQ si internal links mai puternice.`,
      outline: safeJson(outline),
      faq: safeJson(faq),
      internalLinks: safeJson(internalLinks),
      geoBlocks: safeJson(geoBlocks),
      monetizationNotes: analysis.recommendedActions.join('\n'),
      siteId: post.siteId,
      clusterId: post.topicClusterId,
      categoryId: post.categoryId,
      postId: post.id,
    },
    create: {
      name: `Refresh content: ${post.title}`,
      slug,
      intent: 'INFORMATIONAL',
      priority: mapPriority(analysis.refreshPriority),
      status: mapRefreshToOpportunityStatus(analysis.effectiveStatus),
      monetizationPotential: clamp(40 + Math.round((100 - analysis.contentHealthScore) * 0.25), 20, 85),
      geoPotential: clamp(45 + Math.round((100 - (post.geoScore || 0)) * 0.5), 25, 95),
      difficulty: clamp(20 + analysis.recommendedActions.length * 6, 20, 70),
      opportunityType: 'STALE_CONTENT',
      summary: analysis.reasons.join(' '),
      recommendedTitle: post.title,
      recommendedMeta: post.metaDescription || `Actualizeaza pagina ${post.title.toLowerCase()} pentru raspuns direct, FAQ si internal links mai puternice.`,
      outline: safeJson(outline),
      faq: safeJson(faq),
      internalLinks: safeJson(internalLinks),
      geoBlocks: safeJson(geoBlocks),
      monetizationNotes: analysis.recommendedActions.join('\n'),
      siteId: post.siteId,
      clusterId: post.topicClusterId,
      categoryId: post.categoryId,
      postId: post.id,
    },
  })
}

export async function syncStaleContentEngine(siteId: string) {
  const posts = await prisma.post.findMany({
    where: { siteId, status: 'PUBLISHED' },
    select: {
      id: true,
      siteId: true,
      title: true,
      slug: true,
      postType: true,
      status: true,
      metaDescription: true,
      focusKeyword: true,
      geoScore: true,
      directAnswer: true,
      contentHtml: true,
      contentJson: true,
      schemaMarkup: true,
      sourceType: true,
      publishedAt: true,
      updatedAt: true,
      categoryId: true,
      topicClusterId: true,
      refreshStatus: true,
      refreshNotes: true,
      lastReviewedAt: true,
      category: { select: { slug: true, name: true } },
    },
    orderBy: [{ refreshPriority: 'desc' }, { updatedAt: 'asc' }],
  })

  let refreshNeeded = 0
  let watch = 0
  let refreshed = 0

  for (const post of posts as RefreshCandidate[]) {
    const analysis = calculateRefreshAnalysis(post)

    await prisma.post.update({
      where: { id: post.id },
      data: {
        contentDecayScore: analysis.contentDecayScore,
        contentHealthScore: analysis.contentHealthScore,
        refreshPriority: analysis.refreshPriority,
        refreshStatus: analysis.effectiveStatus,
      },
    })

    await upsertStaleOpportunity(post, analysis)

    if (analysis.effectiveStatus === 'REFRESH_NEEDED') refreshNeeded += 1
    if (analysis.effectiveStatus === 'WATCH') watch += 1
    if (analysis.effectiveStatus === 'REFRESHED') refreshed += 1
  }

  return {
    total: posts.length,
    refreshNeeded,
    watch,
    refreshed,
  }
}

function buildRow(post: RefreshCandidate): RefreshRow {
  const analysis = calculateRefreshAnalysis(post)
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    postType: post.postType,
    status: post.status,
    url: analysis.url,
    category: post.category,
    refreshStatus: analysis.effectiveStatus,
    refreshNotes: post.refreshNotes,
    lastReviewedAt: post.lastReviewedAt,
    updatedAt: post.updatedAt,
    publishedAt: post.publishedAt,
    ageDays: analysis.ageDays,
    wordCount: analysis.wordCount,
    linkCount: analysis.linkCount,
    missingImageAltCount: analysis.missingImageAltCount,
    contentDecayScore: analysis.contentDecayScore,
    contentHealthScore: analysis.contentHealthScore,
    refreshPriority: analysis.refreshPriority,
    reasons: analysis.reasons,
    recommendedActions: analysis.recommendedActions,
  }
}

export async function getStaleContentReport(siteId: string) {
  const posts = await prisma.post.findMany({
    where: { siteId, status: 'PUBLISHED' },
    select: {
      id: true,
      siteId: true,
      title: true,
      slug: true,
      postType: true,
      status: true,
      metaDescription: true,
      focusKeyword: true,
      geoScore: true,
      directAnswer: true,
      contentHtml: true,
      contentJson: true,
      schemaMarkup: true,
      sourceType: true,
      publishedAt: true,
      updatedAt: true,
      categoryId: true,
      topicClusterId: true,
      refreshStatus: true,
      refreshNotes: true,
      lastReviewedAt: true,
      category: { select: { slug: true, name: true } },
    },
    orderBy: [{ refreshPriority: 'desc' }, { updatedAt: 'asc' }],
    take: 250,
  })

  const rows = (posts as RefreshCandidate[])
    .map(buildRow)
    .sort((a, b) => b.refreshPriority - a.refreshPriority || b.contentDecayScore - a.contentDecayScore || a.ageDays - b.ageDays)

  return {
    summary: {
      totalPublished: rows.length,
      refreshNeeded: rows.filter((row) => row.refreshStatus === 'REFRESH_NEEDED').length,
      watch: rows.filter((row) => row.refreshStatus === 'WATCH').length,
      inRefresh: rows.filter((row) => row.refreshStatus === 'IN_REFRESH').length,
      refreshed: rows.filter((row) => row.refreshStatus === 'REFRESHED').length,
      avgDecayScore: rows.length ? Math.round(rows.reduce((sum, row) => sum + row.contentDecayScore, 0) / rows.length) : 0,
      avgHealthScore: rows.length ? Math.round(rows.reduce((sum, row) => sum + row.contentHealthScore, 0) / rows.length) : 0,
      withoutReview: rows.filter((row) => !row.lastReviewedAt).length,
    },
    urgent: rows.filter((row) => row.refreshPriority >= 60 || row.refreshStatus === 'IN_REFRESH').slice(0, 20),
    watchlist: rows.filter((row) => row.refreshStatus === 'WATCH').slice(0, 20),
    recentlyRefreshed: rows.filter((row) => row.refreshStatus === 'REFRESHED').slice(0, 12),
    all: rows.slice(0, 120),
  }
}

export async function updateRefreshState(siteId: string, postId: string, input: { refreshStatus?: RefreshStatus; refreshNotes?: string | null; markReviewed?: boolean }) {
  const post = await prisma.post.findFirst({
    where: { id: postId, siteId },
    select: {
      id: true,
      slug: true,
      refreshStatus: true,
    },
  })

  if (!post) {
    throw new Error('Post not found')
  }

  const nextStatus = input.refreshStatus || post.refreshStatus
  const lastReviewedAt = input.markReviewed || nextStatus === 'REFRESHED' ? new Date() : undefined

  const updated = await prisma.post.update({
    where: { id: postId },
    data: {
      refreshStatus: nextStatus,
      refreshNotes: typeof input.refreshNotes === 'string' ? input.refreshNotes : undefined,
      lastReviewedAt,
    },
    select: {
      id: true,
      slug: true,
      refreshStatus: true,
      refreshNotes: true,
      lastReviewedAt: true,
    },
  })

  await prisma.contentOpportunity.updateMany({
    where: { siteId, postId, opportunityType: 'STALE_CONTENT' },
    data: { status: mapRefreshToOpportunityStatus(nextStatus), monetizationNotes: typeof input.refreshNotes === 'string' ? input.refreshNotes : undefined },
  })

  return updated
}
