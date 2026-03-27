/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { buildMetadata } from '@/lib/frontend/metadata'
import { generateSchema } from '@/lib/seo/schema-generator'
import { calculateGeoScore } from '@/lib/seo/geo-scorer'
import { ArticleTemplate } from '@/components/frontend/ArticleTemplate'
import { HubTemplate } from '@/components/frontend/HubTemplate'
import { DreamTemplate } from '@/components/frontend/DreamTemplate'
import { findCategoryPath, parseDreamInterpretationBlocks, parseDreamSymbols } from '@/lib/frontend/content'
import { getRelatedDreams, getRelatedPosts } from '@/lib/seo/internal-linker'
import { mergeAdsConfig } from '@/lib/ads/config'
import { getRecommendedAffiliateProducts } from '@/lib/monetization/affiliate-matcher'
import { getCurrentSiteBranding, resolveCurrentSite } from '@/lib/sites/resolver'

export const revalidate = 7200

async function loadPost(siteId: string | undefined, categorySlug: string, slug: string) {
  return prisma.post.findFirst({
    where: {
      ...(siteId ? { siteId } : {}),
      slug,
      status: 'PUBLISHED',
      category: { slug: categorySlug },
    },
    include: {
      author: { select: { name: true, slug: true, headline: true, bio: true, credentials: true, methodology: true, expertise: true, trustStatement: true } },
      topicCluster: {
        include: {
          keywords: { select: { name: true }, take: 6 },
        },
      },
      category: {
        include: {
          parent: {
            include: {
              parent: true,
            },
          },
        },
      },
    },
  })
}

export async function generateMetadata({ params }: { params: { categorySlug: string; slug: string } }): Promise<Metadata> {
  const siteContext = await resolveCurrentSite()
  const [branding, post] = await Promise.all([
    getCurrentSiteBranding(),
    loadPost(siteContext.site.id, params.categorySlug, params.slug),
  ])
  if (!post) return {}

  const siteUrl = branding.siteUrl
  const siteName = branding.siteName
  const canonical = post.canonicalUrl || `${siteUrl.replace(/\/$/, '')}/${params.categorySlug}/${params.slug}`

  let ogImage: string | null = null
  if (post.ogImageId) {
    const media = await prisma.media.findUnique({ where: { id: post.ogImageId } })
    ogImage = media?.url || null
  }

  return buildMetadata({
    siteUrl,
    siteName,
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt || '',
    canonical,
    noIndex: post.noIndex,
    ogImage,
  })
}

export default async function CategoryArticlePage({ params }: { params: { categorySlug: string; slug: string } }) {
  const siteContext = await resolveCurrentSite()
  const post = await loadPost(siteContext.site.id, params.categorySlug, params.slug)
  if (!post) return notFound()

  const dreamSymbols = parseDreamSymbols(post.contentJson as any)

  const relatedPromise = post.postType === 'DREAM_INTERPRETATION'
    ? getRelatedDreams({
        postId: post.id,
        title: post.title,
        focusKeyword: post.focusKeyword,
        categoryId: post.categoryId,
        categorySlug: post.category?.slug,
        contentHtml: post.contentHtml,
        contentJson: post.contentJson,
        postType: post.postType,
        siteId: post.siteId,
      })
    : getRelatedPosts({
        postId: post.id,
        title: post.title,
        focusKeyword: post.focusKeyword,
        categoryId: post.categoryId,
        categorySlug: post.category?.slug,
        contentHtml: post.contentHtml,
        contentJson: post.contentJson,
        postType: post.postType,
        siteId: post.siteId,
      })

  const [branding, featuredImage, related, affiliateProducts] = await Promise.all([
    getCurrentSiteBranding(),
    post.featuredImageId ? prisma.media.findUnique({ where: { id: post.featuredImageId } }) : Promise.resolve(null),
    relatedPromise,
    getRecommendedAffiliateProducts({
      templateType: 'article',
      title: post.title,
      focusKeyword: post.focusKeyword,
      categorySlug: post.category?.slug,
      categoryName: post.category?.name,
      symbols: dreamSymbols.map((item) => item.symbolName),
    }),
  ])

  const geo = calculateGeoScore(post as any, { name: post.author?.name || null })
  const breadcrumbPath = findCategoryPath(post.category)
  const breadcrumbs = [
    { name: 'Acasa', href: '/' },
    ...breadcrumbPath.map((item) => ({ name: item.name, href: `/${item.slug}` })),
    { name: post.title, href: `/${params.categorySlug}/${params.slug}` },
  ]

  const schema = generateSchema({ ...post, directAnswer: geo.directAnswer } as any, { siteName: branding.siteName, siteUrl: branding.siteUrl }, post.category as any, { speakableSections: geo.speakableSections })

  const sharedProps = {
    title: post.title,
    excerpt: post.excerpt,
    contentHtml: post.contentHtml,
    breadcrumbs,
    authorName: post.author?.name,
    authorProfile: {
      slug: post.author?.slug,
      headline: post.author?.headline,
      bio: post.author?.bio,
      credentials: post.author?.credentials,
      methodology: post.author?.methodology,
      expertise: Array.isArray(post.author?.expertise) ? (post.author?.expertise as string[]) : [],
      trustStatement: post.author?.trustStatement,
    },
    publishedAt: post.publishedAt || post.createdAt,
    featuredImage: featuredImage
      ? { url: featuredImage.url, width: featuredImage.width, height: featuredImage.height, altText: featuredImage.altText }
      : null,
    relatedPosts: related,
    directAnswer: geo.directAnswer,
    llmSummary: geo.llmSummary,
    speakableSections: geo.speakableSections,
    backToCategoryHref: `/${params.categorySlug}`,
    adsConfig: mergeAdsConfig(branding.seoSettings?.adsConfig || branding.adsConfig),
    pagePath: `/${params.categorySlug}/${params.slug}`,
    affiliateProducts,
    sitePackKey: branding.sitePack.key,
  }

  const interpretationBlocks = parseDreamInterpretationBlocks(post.contentJson as any)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      {post.templateType === 'HUB' || post.sourceType === 'HUB' ? (
        <HubTemplate
          title={post.title}
          excerpt={post.excerpt}
          contentHtml={post.contentHtml}
          breadcrumbs={breadcrumbs}
          authorName={post.author?.name}
          publishedAt={post.publishedAt || post.createdAt}
          authorProfile={sharedProps.authorProfile}
          clusterName={post.topicCluster?.name}
          supportAngles={Array.isArray(post.topicCluster?.supportAngles) ? (post.topicCluster?.supportAngles as string[]) : []}
          keywords={Array.isArray(post.topicCluster?.keywords) ? post.topicCluster.keywords.map((item) => item.name) : []}
          relatedPosts={related}
          pagePath={`/${params.categorySlug}/${params.slug}`}
        />
      ) : post.templateType === 'DREAM' || post.postType === 'DREAM_INTERPRETATION' ? (
        <DreamTemplate
          {...sharedProps}
          dreamSymbols={dreamSymbols}
          interpretation={interpretationBlocks[0] || undefined}
        />
      ) : (
        <ArticleTemplate {...sharedProps} />
      )}
    </>
  )
}




