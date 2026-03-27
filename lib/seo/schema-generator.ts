/* eslint-disable @typescript-eslint/no-explicit-any */
import { buildSpeakableSections, buildSpeakableSpecification } from './speakable-schema'

export type SeoSettings = {
  siteName?: string | null
  siteUrl?: string | null
}

type CategoryNode = {
  name: string
  slug: string
  parent?: CategoryNode | null
}

type Author = {
  name?: string | null
  email?: string | null
  slug?: string | null
  bio?: string | null
  credentials?: string | null
  methodology?: string | null
  expertise?: string[] | null
}

type PostLike = {
  id?: string
  title?: string
  slug?: string
  excerpt?: string | null
  contentHtml?: string
  contentJson?: unknown
  postType?: 'ARTICLE' | 'DREAM_INTERPRETATION' | 'SYMBOL'
  metaTitle?: string | null
  metaDescription?: string | null
  publishedAt?: string | Date | null
  createdAt?: string | Date | null
  author?: Author | null
  shortDefinition?: string | null
  name?: string
  focusKeyword?: string | null
  directAnswer?: string | null
}

type SpeakableData = {
  speakableSections?: string[] | null
}

function normalizeUrl(base: string, path: string) {
  if (!base) return path
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

function extractBlocks(contentJson: any) {
  const blocks = {
    faq: [] as Array<{ question: string; answer: string }>,
    dreamSymbols: [] as Array<{ symbolName: string; slug: string; shortMeaning?: string }>,
    dreamInterpretations: [] as Array<{
      dreamTitle?: string
      generalMeaning?: string
      psychologicalMeaning?: string
      spiritualMeaning?: string
      warningNote?: string
    }>,
    quickAnswers: [] as Array<{ question?: string; answer?: string; supportingDetail?: string }>,
    expertTakes: [] as Array<{ expertName?: string; expertRole?: string; take?: string }>,
  }

  function walk(node: any) {
    if (!node) return
    if (node.type === 'faqBlock' && node.attrs?.payload?.items) {
      blocks.faq.push(...node.attrs.payload.items)
    }
    if (node.type === 'dreamSymbolsListBlock' && node.attrs?.payload?.items) {
      blocks.dreamSymbols.push(...node.attrs.payload.items)
    }
    if (node.type === 'dreamInterpretationBlock' && node.attrs?.payload) {
      blocks.dreamInterpretations.push(node.attrs.payload)
    }
    if (node.type === 'quickAnswerBlock' && node.attrs?.payload) {
      blocks.quickAnswers.push(node.attrs.payload)
    }
    if (node.type === 'expertTakeBlock' && node.attrs?.payload) {
      blocks.expertTakes.push(node.attrs.payload)
    }
    if (Array.isArray(node.content)) node.content.forEach(walk)
  }

  walk(contentJson)
  return blocks
}

function breadcrumbList(_siteUrl: string, crumbs: Array<{ name: string; url: string }>) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

function buildBreadcrumbs(siteUrl: string, category?: CategoryNode | null, slug?: string) {
  const crumbs: Array<{ name: string; url: string }> = [{ name: 'Acasa', url: siteUrl }]

  if (category) {
    const stack: CategoryNode[] = []
    let current: CategoryNode | null | undefined = category
    while (current) {
      stack.unshift(current)
      current = current.parent || null
    }

    stack.forEach((cat) => {
      crumbs.push({ name: cat.name, url: normalizeUrl(siteUrl, cat.slug) })
    })
  }

  if (slug) crumbs.push({ name: slug.replace(/-/g, ' '), url: normalizeUrl(siteUrl, slug) })
  return crumbs
}

export function generateSchema(
  post: PostLike,
  seoSettings: SeoSettings,
  category?: CategoryNode | null,
  speakableData?: SpeakableData,
) {
  const siteUrl = seoSettings.siteUrl || 'https://candvisam.ro'
  const siteName = seoSettings.siteName || 'Cand Visam'
  const slug = post.slug || ''
  const url = normalizeUrl(siteUrl, slug)
  const title = post.metaTitle || post.title || post.name || ''
  const description = post.metaDescription || post.excerpt || post.shortDefinition || ''

  const blocks = extractBlocks(post.contentJson)
  const speakableSections =
    speakableData?.speakableSections && speakableData.speakableSections.length > 0
      ? speakableData.speakableSections
      : buildSpeakableSections(post.contentHtml, post.contentJson)
  const hasVisibleSummary = Boolean(post.directAnswer || blocks.quickAnswers.length || blocks.dreamInterpretations.length || blocks.expertTakes.length)
  const speakable = buildSpeakableSpecification(speakableSections, {
    isDreamInterpretation: post.postType === 'DREAM_INTERPRETATION',
    hasVisibleSummary,
  })
  const crumbs = buildBreadcrumbs(siteUrl, category, slug)

  const graph: any[] = []

  graph.push({
    '@type': 'WebSite',
    '@id': `${siteUrl}#website`,
    url: siteUrl,
    name: siteName,
  })

  graph.push(breadcrumbList(siteUrl, crumbs))

  if (post.postType === 'SYMBOL') {
    const definedTerm: any = {
      '@type': 'DefinedTerm',
      name: post.name || post.title || '',
      description: post.shortDefinition || '',
      inDefinedTermSet: {
        name: 'Dictionar de Simboluri Onirice',
        url: normalizeUrl(siteUrl, 'dictionar'),
      },
    }
    if (speakable) definedTerm.speakable = speakable
    if (post.directAnswer) definedTerm.abstract = post.directAnswer
    graph.push(definedTerm)
  } else {
    const article: any = {
      '@type': 'Article',
      headline: title,
      description,
      datePublished: post.publishedAt || post.createdAt || undefined,
      mainEntityOfPage: url,
      author: post.author?.name
        ? {
            '@type': 'Person',
            name: post.author.name,
            url: post.author.slug ? normalizeUrl(siteUrl, `autor/${post.author.slug}`) : undefined,
            description: post.author.bio || post.author.credentials || undefined,
            knowsAbout: Array.isArray(post.author.expertise) ? post.author.expertise : undefined,
          }
        : undefined,
    }

    if (speakable) article.speakable = speakable
    if (post.directAnswer) article.abstract = post.directAnswer

    if (post.postType === 'DREAM_INTERPRETATION') {
      const about = blocks.dreamSymbols.map((item) => ({
        '@type': 'Thing',
        name: item.symbolName || item.slug,
      }))
      if (post.focusKeyword) {
        about.push({ '@type': 'Thing', name: post.focusKeyword })
      }
      if (about.length) article.about = about
    }

    graph.push(article)
  }

  if (blocks.faq.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: blocks.faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    })
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  }
}
