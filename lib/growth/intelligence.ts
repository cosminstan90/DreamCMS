import { Prisma, TopicIntent, TopicPriority } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { DEFAULT_TOPIC_BLUEPRINTS } from '@/lib/content-ops/topic-authority'
import { generateSlug } from '@/lib/utils'

type CsvRow = {
  query: string
  pagePath: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

type ClusterMatcher = {
  id: string
  slug: string
  name: string
  keywords: string[]
}

function safeJson<T>(value: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

function normalizeText(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function normalizePath(input: string) {
  if (!input) return ''
  try {
    const url = input.startsWith('http') ? new URL(input) : new URL(input, 'https://candvisam.ro')
    return url.pathname.replace(/\/$/, '') || '/'
  } catch {
    return input.trim().replace(/^https?:\/\/[^/]+/i, '').replace(/\/$/, '') || ''
  }
}

function toNumber(input: string | undefined) {
  if (!input) return 0
  const normalized = input.replace(/%/g, '').replace(',', '.').trim()
  const value = Number(normalized)
  return Number.isFinite(value) ? value : 0
}

function parseCsvLine(line: string) {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const next = line[index + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      cells.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  cells.push(current.trim())
  return cells
}

function parseCsv(input: string) {
  const lines = input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  if (lines.length < 2) return []

  const headers = parseCsvLine(lines[0]).map((header) => normalizeText(header))
  const queryIndex = headers.findIndex((item) => ['query', 'keyword', 'search query'].includes(item))
  const pageIndex = headers.findIndex((item) => ['page', 'url', 'landing page'].includes(item))
  const clicksIndex = headers.findIndex((item) => item === 'clicks')
  const impressionsIndex = headers.findIndex((item) => item === 'impressions')
  const ctrIndex = headers.findIndex((item) => item === 'ctr')
  const positionIndex = headers.findIndex((item) => ['position', 'avg position'].includes(item))

  if (queryIndex < 0) return []

  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line)
    const clicks = toNumber(cells[clicksIndex])
    const impressions = toNumber(cells[impressionsIndex])
    const ctr = ctrIndex >= 0 ? toNumber(cells[ctrIndex]) : impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(2)) : 0

    return {
      query: cells[queryIndex] || '',
      pagePath: pageIndex >= 0 ? normalizePath(cells[pageIndex]) : '',
      clicks,
      impressions,
      ctr,
      position: toNumber(cells[positionIndex]),
    }
  }).filter((row) => row.query)
}

function detectIntent(query: string): TopicIntent {
  const normalized = normalizeText(query)
  if (/(vs|sau|diferenta|comparatie|mai bun|top|review)/.test(normalized)) return 'INVESTIGATIONAL'
  if (/(pret|cumpar|cadou|magazin|carte|curs|produs)/.test(normalized)) return 'COMMERCIAL'
  if (/(dictionar|simboluri|lista|index)/.test(normalized)) return 'NAVIGATIONAL'
  return 'INFORMATIONAL'
}

function recommendTemplate(query: string, pagePath: string, clusterSlug?: string | null) {
  const normalized = normalizeText(query)
  if (pagePath.startsWith('/dictionar/') || /\bsimbol\b/.test(normalized)) return 'SYMBOL_PAGE'
  if (/ce inseamna cand visezi|interpretare vis|in vis/.test(normalized)) return 'DREAM_TEMPLATE'
  if (/ghid|lista|simboluri|semnificatii|tipuri/.test(normalized) || (!pagePath && clusterSlug)) return 'HUB_PAGE'
  if (detectIntent(query) === 'INVESTIGATIONAL') return 'COMPARISON_GUIDE'
  return 'ARTICLE_TEMPLATE'
}

function recommendCta(intent: TopicIntent, template: string, pagePath: string) {
  if (template === 'SYMBOL_PAGE' || pagePath.startsWith('/dictionar')) return 'newsletter-dictionary'
  if (intent === 'COMMERCIAL' || intent === 'INVESTIGATIONAL') return 'affiliate-block'
  if (template === 'HUB_PAGE') return 'cluster-navigation'
  return 'newsletter-inline'
}

function monetizeFit(intent: TopicIntent, template: string) {
  if (intent === 'COMMERCIAL') return 'affiliate-first'
  if (intent === 'INVESTIGATIONAL') return 'comparison-plus-newsletter'
  if (template === 'SYMBOL_PAGE') return 'newsletter-plus-related-symbols'
  return 'newsletter-first'
}

function priorityFromScore(score: number): TopicPriority {
  if (score >= 85) return 'CRITICAL'
  if (score >= 65) return 'HIGH'
  if (score >= 40) return 'MEDIUM'
  return 'LOW'
}

function buildClusterMatchers(clusters: Array<{ id: string; slug: string; name: string; keywords: Array<{ name: string }> }>): ClusterMatcher[] {
  return clusters.map((cluster) => {
    const blueprint = DEFAULT_TOPIC_BLUEPRINTS.find((item) => item.slug === cluster.slug)
    return {
      id: cluster.id,
      slug: cluster.slug,
      name: cluster.name,
      keywords: Array.from(new Set([
        cluster.name,
        cluster.slug,
        ...(blueprint?.keywords || []),
        ...cluster.keywords.map((item) => item.name),
      ].map(normalizeText))),
    }
  })
}

function matchCluster(query: string, matchers: ClusterMatcher[]) {
  const normalized = normalizeText(query)
  let best: ClusterMatcher | null = null
  let bestScore = 0

  for (const matcher of matchers) {
    const score = matcher.keywords.reduce((sum, keyword) => sum + (normalized.includes(keyword) ? keyword.length : 0), 0)
    if (score > bestScore) {
      best = matcher
      bestScore = score
    }
  }

  return best
}

function computeOpportunityScore(row: CsvRow, pagePath: string) {
  const impressionScore = Math.min(45, Math.round(Math.log10(Math.max(10, row.impressions)) * 18))
  const ctrGapScore = row.ctr < 2 ? 28 : row.ctr < 4 ? 18 : row.ctr < 6 ? 10 : 0
  const positionScore = row.position >= 3 && row.position <= 15 ? 18 : row.position > 15 && row.position <= 30 ? 10 : 0
  const pageGapScore = pagePath ? 0 : 16
  return Math.min(100, impressionScore + ctrGapScore + positionScore + pageGapScore)
}

async function syncGrowthOpportunities(siteId: string) {
  const [insights, clusters] = await Promise.all([
    prisma.searchQueryInsight.findMany({
      where: { siteId },
      orderBy: [{ opportunityScore: 'desc' }, { impressions: 'desc' }],
      take: 250,
    }),
    prisma.topicCluster.findMany({
      where: { siteId },
      include: {
        posts: { where: { status: 'PUBLISHED' }, select: { id: true } },
        searchInsights: true,
      },
    }),
  ])

  for (const item of insights.filter((entry) => entry.opportunityScore >= 55)) {
    const isCtr = item.pagePath && item.ctr < 4
    const slug = `${isCtr ? 'growth-ctr' : 'growth-gap'}-${item.slug}`
    const title = isCtr
      ? `CTR uplift: ${item.query}`
      : `Search gap: ${item.query}`

    await prisma.contentOpportunity.upsert({
      where: { siteId_slug: { siteId, slug } },
      update: {
        name: title,
        intent: item.intent,
        priority: priorityFromScore(item.opportunityScore),
        status: item.pagePath ? 'READY_TO_WRITE' : 'READY_TO_WRITE',
        monetizationPotential: item.monetizationFit?.includes('affiliate') ? 78 : 55,
        geoPotential: Math.min(95, 45 + Math.round(item.impressions / 40)),
        difficulty: item.pagePath ? 25 : 40,
        opportunityType: isCtr ? 'LOW_CTR_CRO' : 'SEARCH_GAP',
        summary: isCtr
          ? `Query-ul ${item.query} are impresii bune dar CTR slab. Recomandare CTA: ${item.recommendedCta}.`
          : `Query-ul ${item.query} are cerere si nu are pagina mapata. Template recomandat: ${item.recommendedTemplate}.`,
        recommendedTitle: item.query,
        recommendedMeta: isCtr
          ? `Optimizeaza title/meta pentru ${item.query} si testeaza un CTA ${item.recommendedCta}.`
          : `Construieste o pagina noua pentru ${item.query} folosind template-ul ${item.recommendedTemplate}.`,
        geoBlocks: safeJson(['QuickAnswerBlock', 'FAQBlock']),
        monetizationNotes: `CRO suggestion: ${item.recommendedCta}\nMonetization fit: ${item.monetizationFit}`,
        clusterId: item.clusterId,
      },
      create: {
        siteId,
        name: title,
        slug,
        intent: item.intent,
        priority: priorityFromScore(item.opportunityScore),
        status: 'READY_TO_WRITE',
        monetizationPotential: item.monetizationFit?.includes('affiliate') ? 78 : 55,
        geoPotential: Math.min(95, 45 + Math.round(item.impressions / 40)),
        difficulty: item.pagePath ? 25 : 40,
        opportunityType: isCtr ? 'LOW_CTR_CRO' : 'SEARCH_GAP',
        summary: isCtr
          ? `Query-ul ${item.query} are impresii bune dar CTR slab. Recomandare CTA: ${item.recommendedCta}.`
          : `Query-ul ${item.query} are cerere si nu are pagina mapata. Template recomandat: ${item.recommendedTemplate}.`,
        recommendedTitle: item.query,
        recommendedMeta: isCtr
          ? `Optimizeaza title/meta pentru ${item.query} si testeaza un CTA ${item.recommendedCta}.`
          : `Construieste o pagina noua pentru ${item.query} folosind template-ul ${item.recommendedTemplate}.`,
        geoBlocks: safeJson(['QuickAnswerBlock', 'FAQBlock']),
        monetizationNotes: `CRO suggestion: ${item.recommendedCta}\nMonetization fit: ${item.monetizationFit}`,
        clusterId: item.clusterId,
      },
    })
  }

  for (const cluster of clusters) {
    const demand = cluster.searchInsights.reduce((sum, item) => sum + item.impressions, 0)
    const supportPages = cluster.posts.length
    const gapScore = Math.max(0, Math.round(demand / 80) - supportPages * 8)
    if (gapScore < 25) continue

    await prisma.contentOpportunity.upsert({
      where: { siteId_slug: { siteId, slug: `cluster-demand-${cluster.slug}` } },
      update: {
        name: `Cluster expansion: ${cluster.name}`,
        intent: cluster.intent,
        priority: priorityFromScore(gapScore),
        status: 'READY_TO_WRITE',
        monetizationPotential: cluster.monetizationPotential,
        geoPotential: cluster.geoPotential,
        difficulty: Math.max(20, cluster.difficulty - 8),
        opportunityType: 'CLUSTER_EXPANSION',
        summary: `Clusterul ${cluster.name} are cerere estimata ${demand} si doar ${supportPages} pagini publicate.`,
        recommendedTitle: cluster.pillarTitle || cluster.name,
        recommendedMeta: `Extinde clusterul ${cluster.name} cu support pages si CTA-uri aliniate cu intentia de cautare.`,
        clusterId: cluster.id,
      },
      create: {
        siteId,
        name: `Cluster expansion: ${cluster.name}`,
        slug: `cluster-demand-${cluster.slug}`,
        intent: cluster.intent,
        priority: priorityFromScore(gapScore),
        status: 'READY_TO_WRITE',
        monetizationPotential: cluster.monetizationPotential,
        geoPotential: cluster.geoPotential,
        difficulty: Math.max(20, cluster.difficulty - 8),
        opportunityType: 'CLUSTER_EXPANSION',
        summary: `Clusterul ${cluster.name} are cerere estimata ${demand} si doar ${supportPages} pagini publicate.`,
        recommendedTitle: cluster.pillarTitle || cluster.name,
        recommendedMeta: `Extinde clusterul ${cluster.name} cu support pages si CTA-uri aliniate cu intentia de cautare.`,
        clusterId: cluster.id,
      },
    })
  }
}

export async function importSearchInsights(siteId: string, csvText: string, source = 'manual') {
  const rows = parseCsv(csvText)
  if (!rows.length) {
    throw new Error('CSV invalid sau fara randuri utile. Coloane minime: query, clicks, impressions, ctr, position, page/url.')
  }

  const clusters = await prisma.topicCluster.findMany({ where: { siteId }, include: { keywords: true } })
  const matchers = buildClusterMatchers(clusters)
  let imported = 0

  for (const row of rows) {
    const slug = generateSlug(row.query)
    const cluster = matchCluster(row.query, matchers)
    const intent = detectIntent(row.query)
    const template = recommendTemplate(row.query, row.pagePath, cluster?.slug || null)
    const cta = recommendCta(intent, template, row.pagePath)
    const fit = monetizeFit(intent, template)
    const opportunityScore = computeOpportunityScore(row, row.pagePath)

    await prisma.searchQueryInsight.upsert({
      where: { siteId_slug_pagePath: { siteId, slug, pagePath: row.pagePath || '' } },
      update: {
        query: row.query,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
        source,
        intent,
        clusterLabel: cluster?.name || null,
        recommendedTemplate: template,
        recommendedCta: cta,
        monetizationFit: fit,
        opportunityScore,
        clusterId: cluster?.id || null,
        lastImportedAt: new Date(),
      },
      create: {
        siteId,
        query: row.query,
        slug,
        pagePath: row.pagePath || '',
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        position: row.position,
        source,
        intent,
        clusterLabel: cluster?.name || null,
        recommendedTemplate: template,
        recommendedCta: cta,
        monetizationFit: fit,
        opportunityScore,
        clusterId: cluster?.id || null,
        lastImportedAt: new Date(),
      },
    })

    imported += 1
  }

  await syncGrowthOpportunities(siteId)

  return { imported }
}

export async function getGrowthReport(siteId: string) {
  const [insights, clusters, opportunities] = await Promise.all([
    prisma.searchQueryInsight.findMany({
      where: { siteId },
      orderBy: [{ opportunityScore: 'desc' }, { impressions: 'desc' }],
      take: 250,
    }),
    prisma.topicCluster.findMany({
      where: { siteId },
      include: {
        keywords: true,
        posts: { where: { status: 'PUBLISHED' }, select: { id: true, slug: true, title: true } },
        searchInsights: true,
      },
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
    }),
    prisma.contentOpportunity.findMany({
      where: { siteId, opportunityType: { in: ['SEARCH_GAP', 'LOW_CTR_CRO', 'CLUSTER_EXPANSION'] } },
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
      take: 40,
    }),
  ])

  const topQueries = insights.slice(0, 20)
  const ctrOpportunities = insights
    .filter((item) => item.pagePath && item.impressions >= 80 && item.ctr < 4)
    .sort((a, b) => b.impressions - a.impressions || a.ctr - b.ctr)
    .slice(0, 20)

  const supportPageSuggestions = insights
    .filter((item) => !item.pagePath && item.opportunityScore >= 55)
    .slice(0, 20)

  const clusterCoverage = clusters.map((cluster) => {
    const demand = cluster.searchInsights.reduce((sum, item) => sum + item.impressions, 0)
    const avgCtr = cluster.searchInsights.length
      ? Number((cluster.searchInsights.reduce((sum, item) => sum + item.ctr, 0) / cluster.searchInsights.length).toFixed(2))
      : 0
    const completenessScore = Math.min(100, Math.round(
      Math.min(35, cluster.posts.length * 10) +
      Math.min(25, cluster.keywords.length * 4) +
      Math.min(25, cluster.searchInsights.length * 3) +
      Math.min(15, demand / 120)
    ))

    return {
      id: cluster.id,
      name: cluster.name,
      slug: cluster.slug,
      demand,
      avgCtr,
      supportPages: cluster.posts.length,
      keywordCount: cluster.keywords.length,
      queryCount: cluster.searchInsights.length,
      completenessScore,
      gapScore: Math.max(0, demand - cluster.posts.length * 120),
    }
  }).sort((a, b) => b.gapScore - a.gapScore)

  const croSuggestions = insights
    .filter((item) => item.impressions >= 60)
    .map((item) => ({
      id: item.id,
      query: item.query,
      pagePath: item.pagePath,
      impressions: item.impressions,
      ctr: item.ctr,
      template: item.recommendedTemplate,
      cta: item.recommendedCta,
      fit: item.monetizationFit,
      score: item.opportunityScore,
      suggestion: item.pagePath
        ? `Pe ${item.pagePath || 'pagina noua'} testeaza ${item.recommendedCta} si rescrie title/meta pentru query-ul ${item.query}.`
        : `Creeaza pagina noua pentru ${item.query} si pregateste CTA ${item.recommendedCta} din prima versiune.`,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)

  return {
    summary: {
      importedQueries: insights.length,
      highOpportunityQueries: insights.filter((item) => item.opportunityScore >= 55).length,
      lowCtrQueries: ctrOpportunities.length,
      gapQueries: supportPageSuggestions.length,
      activeOpportunities: opportunities.length,
    },
    topQueries,
    ctrOpportunities,
    supportPageSuggestions,
    clusterCoverage,
    croSuggestions,
    syncedOpportunities: opportunities.map((item) => ({
      id: item.id,
      name: item.name,
      type: item.opportunityType,
      priority: item.priority,
      status: item.status,
    })),
  }
}
