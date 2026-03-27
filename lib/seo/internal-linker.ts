import { prisma } from '@/lib/prisma'
import { extractInternalLinks, stripHtml } from './content-audit'

type JsonNode = {
  type?: string
  text?: string
  attrs?: Record<string, unknown>
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>
  content?: JsonNode[]
}

type ContentContextInput = {
  siteId?: string | null
  title?: string
  focusKeyword?: string | null
  contentHtml?: string
  contentJson?: unknown
  categoryId?: string | null
  categorySlug?: string | null
  postType?: string | null
  topicCluster?: string | null
}

export type LinkSuggestion = {
  id: string
  targetType: 'post' | 'symbol' | 'hub' | 'dream'
  title: string
  href: string
  anchorText: string
  relevance: number
  reasons: string[]
}

type SuggestInternalLinksInput = ContentContextInput & {
  slug?: string
  excludePostId?: string | null
  excludeSymbolId?: string | null
  limit?: number
}

type RelatedPostsInput = ContentContextInput & {
  postId: string
}

type RelatedSymbolsInput = {
  siteId?: string | null
  symbolId: string
  name: string
  shortDefinition?: string | null
  fullContent?: string | null
  relatedSlugs?: string[]
  topicCluster?: string | null
}

type AutoLinkInput = {
  contentJson: unknown
  contentHtml: string
  suggestions: LinkSuggestion[]
  maxLinks?: number
}

type AppliedAutoLink = {
  href: string
  anchorText: string
  title: string
  targetType: LinkSuggestion['targetType']
}

type RelatedPostOutput = {
  id: string
  title: string
  slug: string
  postType: string
  category: { slug: string; name: string } | null
}

const STOP_WORDS = new Set([
  'care',
  'cand',
  'pentru',
  'despre',
  'foarte',
  'dupa',
  'este',
  'sunt',
  'intr',
  'intre',
  'acest',
  'aceasta',
  'din',
  'sau',
  'iar',
  'cum',
  'mai',
  'fara',
  'prin',
  'the',
  'with',
])

const HUB_PAGE_DEFINITIONS = [
  {
    id: 'hub-dictionar',
    title: 'Dictionar de Simboluri Onirice',
    href: '/dictionar',
    anchorText: 'dictionar de simboluri',
    keywords: ['simbol', 'simboluri', 'dictionar', 'semnificatie', 'interpretare simbol'],
  },
  {
    id: 'hub-cauta',
    title: 'Cauta interpretari si simboluri',
    href: '/cauta',
    anchorText: 'cauta interpretari',
    keywords: ['cauta', 'ghid', 'interpretare', 'vise', 'simboluri'],
  },
]

function normalizeText(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function tokenize(input: string) {
  return normalizeText(input)
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token))
}

function overlapScore(a: string[], b: string[]) {
  const setB = new Set(b)
  return a.reduce((acc, token) => (setB.has(token) ? acc + 1 : acc), 0)
}

function phraseMentionScore(text: string, phrase: string) {
  if (!phrase) return 0
  return normalizeText(text).includes(normalizeText(phrase)) ? 1 : 0
}

function titleCaseAnchor(input: string) {
  return input.trim() || 'Vezi articolul'
}

function uniqStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)))
}

function nodeHasLink(node: JsonNode) {
  return Array.isArray(node.marks) && node.marks.some((mark) => mark.type === 'link')
}

function walkJson(node: JsonNode | null | undefined, visitor: (node: JsonNode) => void) {
  if (!node) return
  visitor(node)
  if (Array.isArray(node.content)) {
    node.content.forEach((child) => walkJson(child, visitor))
  }
}

function extractMentionedSymbols(contentJson: unknown, fallbackText?: string) {
  const mentions = new Set<string>()

  walkJson(contentJson as JsonNode, (node) => {
    if (node.type === 'dreamSymbolsListBlock') {
      const items = ((node.attrs?.payload as { items?: Array<{ symbolName?: string }> } | undefined)?.items) || []
      items.forEach((item) => {
        if (item?.symbolName) mentions.add(item.symbolName)
      })
    }

    if (node.type === 'symbolCardBlock') {
      const symbolName = ((node.attrs?.payload as { symbolName?: string } | undefined)?.symbolName) || ''
      if (symbolName) mentions.add(symbolName)
    }
  })

  const text = String(fallbackText || '')
  const symbolish = text.match(/\b[A-ZĂÂÎȘȚ][a-zăâîșț]{2,}(?:\s+[A-ZĂÂÎȘȚ]?[a-zăâîșț]{2,})?\b/g) || []
  symbolish.slice(0, 12).forEach((item) => mentions.add(item))

  return Array.from(mentions)
}

function extractTopicHints(input: ContentContextInput) {
  const plainText = stripHtml(input.contentHtml || '')
  const mentionedSymbols = extractMentionedSymbols(input.contentJson, plainText)
  const tokens = tokenize([
    input.title,
    input.focusKeyword,
    plainText,
    mentionedSymbols.join(' '),
  ]
    .filter(Boolean)
    .join(' '))

  return {
    plainText,
    mentionedSymbols,
    tokens,
    topicCluster: input.topicCluster || input.categorySlug || null,
  }
}

function classifyPostTarget(postType: string | null | undefined): LinkSuggestion['targetType'] {
  return postType === 'DREAM_INTERPRETATION' ? 'dream' : 'post'
}

function getAnchorCandidates(suggestion: LinkSuggestion) {
  return uniqStrings([
    suggestion.anchorText,
    suggestion.title,
    suggestion.targetType === 'symbol' ? suggestion.title : null,
  ]).sort((a, b) => b.length - a.length)
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function findAnchorMatch(text: string, suggestion: LinkSuggestion) {
  const lowerText = text.toLocaleLowerCase('ro-RO')

  for (const candidate of getAnchorCandidates(suggestion)) {
    const lowerCandidate = candidate.toLocaleLowerCase('ro-RO')
    const index = lowerText.indexOf(lowerCandidate)
    if (index >= 0) {
      return {
        anchorText: text.slice(index, index + candidate.length),
        start: index,
        end: index + candidate.length,
      }
    }
  }

  return null
}

function replaceAnchorInParagraph(paragraphHtml: string, suggestion: AppliedAutoLink) {
  if (/<a\b/i.test(paragraphHtml)) return { html: paragraphHtml, inserted: false }

  const match = paragraphHtml.match(/^(<p\b[^>]*>)([\s\S]*)(<\/p>)$/i)
  if (!match) return { html: paragraphHtml, inserted: false }

  const [, startTag, innerHtml, endTag] = match

  for (const candidate of uniqStrings([suggestion.anchorText, suggestion.title]).sort((a, b) => b.length - a.length)) {
    const regex = new RegExp(escapeRegExp(candidate), 'i')
    if (regex.test(innerHtml)) {
      const nextInnerHtml = innerHtml.replace(regex, (anchor: string) => `<a href="${suggestion.href}">${anchor}</a>`)
      return { html: `${startTag}${nextInnerHtml}${endTag}`, inserted: true }
    }
  }

  return { html: paragraphHtml, inserted: false }
}

function applyAutoLinksToHtml(html: string, applied: AppliedAutoLink[]) {
  if (!html.trim() || applied.length === 0) return html

  let appliedCount = 0
  return html.replace(/<p\b[^>]*>[\s\S]*?<\/p>/gi, (paragraph) => {
    if (appliedCount >= applied.length || /<a\b/i.test(paragraph)) return paragraph

    for (let index = appliedCount; index < applied.length; index += 1) {
      const attempt = replaceAnchorInParagraph(paragraph, applied[index])
      if (attempt.inserted) {
        appliedCount = index + 1
        return attempt.html
      }
    }

    return paragraph
  })
}

function paragraphContainsExistingLink(content: JsonNode[] | undefined) {
  return Array.isArray(content) && content.some((node) => nodeHasLink(node))
}

function cloneNode(node: JsonNode): JsonNode {
  return {
    ...node,
    attrs: node.attrs ? { ...node.attrs } : undefined,
    marks: Array.isArray(node.marks) ? node.marks.map((mark) => ({ ...mark, attrs: mark.attrs ? { ...mark.attrs } : undefined })) : undefined,
    content: Array.isArray(node.content) ? node.content.map((child) => cloneNode(child)) : undefined,
  }
}

function processParagraphContent(content: JsonNode[], suggestions: LinkSuggestion[], maxLinks: number, state: { count: number; usedHrefs: Set<string>; applied: AppliedAutoLink[] }) {
  const nextContent: JsonNode[] = []

  for (const child of content) {
    if (state.count >= maxLinks) {
      nextContent.push(cloneNode(child))
      continue
    }

    if (child.type !== 'text' || typeof child.text !== 'string' || nodeHasLink(child)) {
      nextContent.push(cloneNode(child))
      continue
    }

    let inserted = false
    for (const suggestion of suggestions) {
      if (state.count >= maxLinks) break
      if (state.usedHrefs.has(suggestion.href)) continue

      const match = findAnchorMatch(child.text, suggestion)
      if (!match) continue

      const marks = Array.isArray(child.marks) ? child.marks.map((mark) => ({ ...mark, attrs: mark.attrs ? { ...mark.attrs } : undefined })) : []
      const linkMark = { type: 'link', attrs: { href: suggestion.href } }
      const before = child.text.slice(0, match.start)
      const middle = child.text.slice(match.start, match.end)
      const after = child.text.slice(match.end)

      if (before) nextContent.push({ ...cloneNode(child), text: before })
      nextContent.push({ ...cloneNode(child), text: middle, marks: [...marks, linkMark] })
      if (after) nextContent.push({ ...cloneNode(child), text: after })

      state.count += 1
      state.usedHrefs.add(suggestion.href)
      state.applied.push({
        href: suggestion.href,
        anchorText: middle,
        title: suggestion.title,
        targetType: suggestion.targetType,
      })
      inserted = true
      break
    }

    if (!inserted) {
      nextContent.push(cloneNode(child))
    }
  }

  return nextContent
}

function walkForAutoLinks(node: JsonNode, suggestions: LinkSuggestion[], maxLinks: number, state: { count: number; usedHrefs: Set<string>; applied: AppliedAutoLink[] }, excluded = false): JsonNode {
  const current = cloneNode(node)
  const blockType = current.type || ''
  const isExcluded = excluded || blockType === 'heading' || blockType === 'faqBlock' || blockType === 'calloutBlock'

  if (state.count >= maxLinks) return current

  if (blockType === 'paragraph' && Array.isArray(current.content) && !isExcluded) {
    if (!paragraphContainsExistingLink(current.content)) {
      current.content = processParagraphContent(current.content, suggestions, maxLinks, state)
    }
    return current
  }

  if (Array.isArray(current.content)) {
    current.content = current.content.map((child) => walkForAutoLinks(child, suggestions, maxLinks, state, isExcluded))
  }

  return current
}

export function summarizeInternalLinks(html: string) {
  const links = extractInternalLinks(html || '')
  return {
    count: links.length,
    links,
  }
}

export async function suggestInternalLinks(input: SuggestInternalLinksInput) {
  const limit = Math.min(input.limit || 5, 5)
  const { plainText, mentionedSymbols, tokens, topicCluster } = extractTopicHints(input)
  const currentLinks = new Set(extractInternalLinks(input.contentHtml || '').map((href) => href.toLowerCase()))

  const [posts, symbols, categories] = await Promise.all([
    prisma.post.findMany({
      where: {
        ...(input.siteId ? { siteId: input.siteId } : {}),
        status: 'PUBLISHED',
        NOT: input.excludePostId ? { id: input.excludePostId } : undefined,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        focusKeyword: true,
        postType: true,
        categoryId: true,
        contentHtml: true,
        category: {
          select: {
            slug: true,
            name: true,
            parent: {
              select: { slug: true, name: true },
            },
          },
        },
      },
      take: 180,
      orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
    }),
    prisma.symbolEntry.findMany({
      where: {
        ...(input.siteId ? { siteId: input.siteId } : {}),
        publishedAt: { not: null },
        NOT: input.excludeSymbolId ? { id: input.excludeSymbolId } : undefined,
      },
      select: { id: true, name: true, slug: true, letter: true, shortDefinition: true },
      take: 220,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.category.findMany({
      where: input.siteId ? { siteId: input.siteId } : undefined,
      select: {
        id: true,
        name: true,
        slug: true,
        parent: { select: { slug: true, name: true } },
      },
      take: 120,
      orderBy: { name: 'asc' },
    }),
  ])

  const suggestions: LinkSuggestion[] = []

  for (const post of posts) {
    const href = post.category?.slug ? `/${post.category.slug}/${post.slug}` : `/${post.slug}`
    if (input.slug && input.slug === post.slug) continue
    if (currentLinks.has(href.toLowerCase())) continue

    const exactTitleMention = phraseMentionScore(plainText, post.title)
    const focusMention = post.focusKeyword ? phraseMentionScore(plainText, post.focusKeyword) : 0
    const sameCategory = input.categoryId && post.categoryId === input.categoryId ? 1 : 0
    const sameCluster = topicCluster && (post.category?.slug === topicCluster || post.category?.parent?.slug === topicCluster) ? 1 : 0
    const mentionedSymbolOverlap = overlapScore(tokenize(mentionedSymbols.join(' ')), tokenize(`${post.title} ${post.focusKeyword || ''} ${post.contentHtml || ''}`))
    const semanticOverlap = overlapScore(tokens, tokenize(`${post.title} ${post.focusKeyword || ''} ${post.contentHtml || ''}`))
    const relevance = exactTitleMention * 28 + focusMention * 16 + sameCategory * 14 + sameCluster * 12 + mentionedSymbolOverlap * 8 + semanticOverlap * 6

    if (relevance < 18) continue

    const reasons: string[] = []
    if (exactTitleMention) reasons.push('Exact match in continut')
    if (focusMention) reasons.push('Focus keyword mentionat')
    if (sameCategory) reasons.push('Acelasi cluster de categorie')
    if (sameCluster) reasons.push('Hub semantic relevant')
    if (mentionedSymbolOverlap > 0) reasons.push(`Simboluri comune (${mentionedSymbolOverlap})`)
    if (semanticOverlap > 0) reasons.push(`Relevanta semantica (${semanticOverlap})`)

    suggestions.push({
      id: post.id,
      targetType: classifyPostTarget(post.postType),
      title: post.title,
      href,
      anchorText: titleCaseAnchor(post.focusKeyword || post.title),
      relevance,
      reasons,
    })
  }

  for (const symbol of symbols) {
    const href = `/dictionar/${symbol.letter}/${symbol.slug}`
    if (currentLinks.has(href.toLowerCase())) continue

    const exactMention = phraseMentionScore(plainText, symbol.name)
    const definitionMention = phraseMentionScore(plainText, symbol.shortDefinition || '')
    const mentionedBonus = mentionedSymbols.some((entry) => normalizeText(entry) === normalizeText(symbol.name)) ? 1 : 0
    const semanticOverlap = overlapScore(tokens, tokenize(`${symbol.name} ${symbol.shortDefinition || ''}`))
    const relevance = exactMention * 30 + mentionedBonus * 20 + definitionMention * 10 + semanticOverlap * 8

    if (relevance < 18) continue

    const reasons: string[] = []
    if (exactMention) reasons.push('Simbol mentionat explicit')
    if (mentionedBonus) reasons.push('Simbol extras din blocuri custom')
    if (definitionMention) reasons.push('Definitie corelata cu textul')
    if (semanticOverlap > 0) reasons.push(`Termeni comuni (${semanticOverlap})`)

    suggestions.push({
      id: symbol.id,
      targetType: 'symbol',
      title: symbol.name,
      href,
      anchorText: titleCaseAnchor(symbol.name),
      relevance,
      reasons,
    })
  }

  for (const category of categories) {
    const href = `/${category.slug}`
    if (currentLinks.has(href.toLowerCase())) continue
    if (input.categorySlug && input.categorySlug === category.slug) continue

    const exactMention = phraseMentionScore(plainText, category.name)
    const semanticOverlap = overlapScore(tokens, tokenize(category.name))
    const clusterBonus = topicCluster && (category.slug === topicCluster || category.parent?.slug === topicCluster) ? 1 : 0
    const relevance = exactMention * 22 + semanticOverlap * 7 + clusterBonus * 8

    if (relevance < 14) continue

    const reasons: string[] = []
    if (exactMention) reasons.push('Hub mentionat explicit')
    if (clusterBonus) reasons.push('Cluster topic apropiat')
    if (semanticOverlap > 0) reasons.push(`Intent comun (${semanticOverlap})`)

    suggestions.push({
      id: category.id,
      targetType: 'hub',
      title: category.name,
      href,
      anchorText: titleCaseAnchor(category.name),
      relevance,
      reasons,
    })
  }

  for (const hub of HUB_PAGE_DEFINITIONS) {
    if (currentLinks.has(hub.href.toLowerCase())) continue

    const exactMention = hub.keywords.some((keyword) => phraseMentionScore(plainText, keyword)) ? 1 : 0
    const semanticOverlap = overlapScore(tokens, tokenize(hub.keywords.join(' ')))
    const symbolBias = hub.href === '/dictionar' && mentionedSymbols.length > 0 ? 1 : 0
    const relevance = exactMention * 18 + semanticOverlap * 6 + symbolBias * 10

    if (relevance < 14) continue

    const reasons: string[] = []
    if (exactMention) reasons.push('Intent de hub detectat in text')
    if (symbolBias) reasons.push('Simboluri mentionate in continut')
    if (semanticOverlap > 0) reasons.push(`Relevanta de intent (${semanticOverlap})`)

    suggestions.push({
      id: hub.id,
      targetType: 'hub',
      title: hub.title,
      href: hub.href,
      anchorText: hub.anchorText,
      relevance,
      reasons,
    })
  }

  return suggestions
    .sort((a, b) => b.relevance - a.relevance)
    .filter((item, index, array) => array.findIndex((entry) => entry.href === item.href) === index)
    .slice(0, limit)
}

function buildRelatedScore(base: ReturnType<typeof extractTopicHints>, candidate: { title: string; focusKeyword?: string | null; contentHtml?: string | null; categoryId?: string | null; category?: { slug?: string | null; parent?: { slug?: string | null } | null } | null; postType?: string | null }) {
  const candidateText = `${candidate.title} ${candidate.focusKeyword || ''} ${candidate.contentHtml || ''}`
  const semanticOverlap = overlapScore(base.tokens, tokenize(candidateText))
  const sameCategory = base.topicCluster && candidate.category?.slug === base.topicCluster ? 1 : 0
  const sameParentCluster = base.topicCluster && candidate.category?.parent?.slug === base.topicCluster ? 1 : 0
  const symbolOverlap = overlapScore(tokenize(base.mentionedSymbols.join(' ')), tokenize(candidateText))
  const keywordMention = base.topicCluster && phraseMentionScore(candidateText, base.topicCluster) ? 1 : 0

  return semanticOverlap * 7 + sameCategory * 16 + sameParentCluster * 10 + symbolOverlap * 12 + keywordMention * 4
}

export async function getRelatedPosts(input: RelatedPostsInput) {
  const candidates = await prisma.post.findMany({
    where: {
      ...(input.siteId ? { siteId: input.siteId } : {}),
      status: 'PUBLISHED',
      NOT: { id: input.postId },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      postType: true,
      focusKeyword: true,
      contentHtml: true,
      categoryId: true,
      category: {
        select: {
          name: true,
          slug: true,
          parent: { select: { slug: true } },
        },
      },
    },
    take: 90,
    orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
  })

  const base = extractTopicHints(input)

  return candidates
    .map((post) => ({
      ...post,
      _score: buildRelatedScore(base, post),
    }))
    .filter((post) => post._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, 3)
    .map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      postType: post.postType,
      category: post.category ? { slug: post.category.slug, name: post.category.name } : null,
    })) as RelatedPostOutput[]
}

export async function getRelatedDreams(input: RelatedPostsInput) {
  const candidates = await prisma.post.findMany({
    where: {
      ...(input.siteId ? { siteId: input.siteId } : {}),
      status: 'PUBLISHED',
      postType: 'DREAM_INTERPRETATION',
      NOT: { id: input.postId },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      postType: true,
      focusKeyword: true,
      contentHtml: true,
      categoryId: true,
      category: {
        select: {
          name: true,
          slug: true,
          parent: { select: { slug: true } },
        },
      },
    },
    take: 90,
    orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
  })

  const base = extractTopicHints({ ...input, postType: 'DREAM_INTERPRETATION' })

  return candidates
    .map((post) => ({
      ...post,
      _score: buildRelatedScore(base, post) + (post.postType === 'DREAM_INTERPRETATION' ? 10 : 0),
    }))
    .filter((post) => post._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, 3)
    .map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      postType: post.postType,
      category: post.category ? { slug: post.category.slug, name: post.category.name } : null,
    })) as RelatedPostOutput[]
}

export async function getRelatedSymbols(input: RelatedSymbolsInput) {
  const candidates = await prisma.symbolEntry.findMany({
    where: {
      ...(input.siteId ? { siteId: input.siteId } : {}),
      publishedAt: { not: null },
      NOT: { id: input.symbolId },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      letter: true,
      shortDefinition: true,
      fullContent: true,
    },
    take: 180,
    orderBy: { name: 'asc' },
  })

  const preferred = new Set(input.relatedSlugs || [])
  const base = extractTopicHints({
    title: input.name,
    focusKeyword: input.shortDefinition,
    contentHtml: input.fullContent || '',
    topicCluster: input.topicCluster || null,
  })

  return candidates
    .map((symbol) => {
      const semanticOverlap = overlapScore(base.tokens, tokenize(`${symbol.name} ${symbol.shortDefinition || ''} ${symbol.fullContent || ''}`))
      const explicitRelated = preferred.has(symbol.slug) ? 18 : 0
      const nameOverlap = phraseMentionScore(`${input.name} ${input.shortDefinition || ''}`, symbol.name) ? 1 : 0
      return {
        ...symbol,
        _score: semanticOverlap * 7 + explicitRelated + nameOverlap * 10,
      }
    })
    .filter((symbol) => symbol._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, 6)
    .map((symbol) => ({ id: symbol.id, slug: symbol.slug, name: symbol.name, letter: symbol.letter }))
}

export function applyAutoInternalLinksToContent(input: AutoLinkInput) {
  const maxLinks = Math.min(input.maxLinks || 2, 2)
  if (!input.contentJson || typeof input.contentJson !== 'object' || !Array.isArray((input.contentJson as JsonNode).content)) {
    return {
      contentJson: input.contentJson,
      contentHtml: input.contentHtml,
      inserted: [] as AppliedAutoLink[],
    }
  }

  const state = {
    count: 0,
    usedHrefs: new Set<string>(),
    applied: [] as AppliedAutoLink[],
  }

  const nextJson = walkForAutoLinks(input.contentJson as JsonNode, input.suggestions, maxLinks, state)
  const nextHtml = applyAutoLinksToHtml(input.contentHtml || '', state.applied)

  return {
    contentJson: nextJson,
    contentHtml: nextHtml,
    inserted: state.applied,
  }
}

