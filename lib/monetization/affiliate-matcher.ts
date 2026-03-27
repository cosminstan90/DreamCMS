import { AffiliateProduct } from '@prisma/client'
import { prisma } from '@/lib/prisma'

type MatcherContext = {
  title: string
  focusKeyword?: string | null
  categorySlug?: string | null
  categoryName?: string | null
  symbols?: string[]
  templateType: 'article' | 'symbol' | 'dictionary' | 'homepage'
}

type AffiliateProductView = Pick<
  AffiliateProduct,
  'id' | 'title' | 'slug' | 'affiliateUrl' | 'image' | 'priceText' | 'badge' | 'merchant' | 'network' | 'category'
>

function normalize(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function splitKeywords(input: string) {
  return normalize(input)
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 3)
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : []
}

function scoreProduct(product: AffiliateProduct, context: MatcherContext) {
  const contextTokens = splitKeywords(
    [context.title, context.focusKeyword, context.categoryName, context.categorySlug].filter(Boolean).join(' '),
  )
  const productKeywordTokens = asStringArray(product.relatedKeywords).flatMap((entry) => splitKeywords(entry))
  const relatedCategories = asStringArray(product.relatedCategories).map(normalize)
  const relatedSymbols = asStringArray(product.relatedSymbols).map(normalize)
  const contextSymbols = (context.symbols || []).map(normalize)

  const overlap = contextTokens.reduce((acc, token) => (productKeywordTokens.includes(token) ? acc + 1 : acc), 0)
  const categoryBoost = relatedCategories.some((entry) =>
    [context.categorySlug, context.categoryName].filter(Boolean).some((val) => normalize(String(val)).includes(entry)),
  )
    ? 8
    : 0
  const symbolBoost = contextSymbols.some((entry) => relatedSymbols.includes(entry)) ? 10 : 0
  const templateBoost = context.templateType === 'symbol' && relatedSymbols.length > 0 ? 4 : 0

  return overlap * 6 + categoryBoost + symbolBoost + templateBoost + Math.min(product.priority, 10)
}

export async function getRecommendedAffiliateProducts(context: MatcherContext, limit = 3): Promise<AffiliateProductView[]> {
  const products = await prisma.affiliateProduct.findMany({
    where: { active: true },
    orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
    take: 60,
  })

  return products
    .map((product) => ({ product, score: scoreProduct(product, context) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => ({
      id: entry.product.id,
      title: entry.product.title,
      slug: entry.product.slug,
      affiliateUrl: entry.product.affiliateUrl,
      image: entry.product.image,
      priceText: entry.product.priceText,
      badge: entry.product.badge,
      merchant: entry.product.merchant,
      network: entry.product.network,
      category: entry.product.category,
    }))
}
