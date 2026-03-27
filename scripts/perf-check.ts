import { prisma } from '../lib/prisma'

function stripHtml(input: string) {
  return input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function countInternalLinks(html: string) {
  const matches = html.match(/<a[^>]+href=["'](\/|https?:\/\/(www\.)?candvisam\.ro)[^"']+["'][^>]*>/gi)
  return matches ? matches.length : 0
}

function countImagesMissingAlt(html: string) {
  const imgs = html.match(/<img[^>]+>/gi) || []
  return imgs.filter((img) => !/alt=/.test(img)).length
}

function wordCount(html: string) {
  const text = stripHtml(html)
  return text ? text.split(' ').filter(Boolean).length : 0
}

async function main() {
  const posts = await prisma.post.findMany({ where: { status: 'PUBLISHED' } })
  const symbols = await prisma.symbolEntry.findMany({ where: { publishedAt: { not: null } } })

  const rows = posts.map((post) => {
    const metaTitleTooLong = post.metaTitle ? post.metaTitle.length > 60 : true
    const metaDescTooLong = post.metaDescription ? post.metaDescription.length > 155 : true
    const internalLinks = countInternalLinks(post.contentHtml)
    const imagesMissingAlt = countImagesMissingAlt(post.contentHtml)
    const wc = wordCount(post.contentHtml)
    const geoScore = post.geoScore || 0

    return {
      type: 'post',
      id: post.id,
      title: post.title,
      metaTitleMissingOrLong: metaTitleTooLong ? 'yes' : 'no',
      metaDescMissingOrLong: metaDescTooLong ? 'yes' : 'no',
      internalLinksZero: internalLinks === 0 ? 'yes' : 'no',
      imagesMissingAlt: imagesMissingAlt > 0 ? imagesMissingAlt : 0,
      wordCount: wc,
      wordCountLow: wc < 400 ? 'yes' : 'no',
      geoScoreLow: geoScore < 50 ? 'yes' : 'no',
      focusKeywordMissing: post.focusKeyword ? 'no' : 'yes',
    }
  })

  const symbolRows = symbols.map((symbol) => {
    const metaTitleTooLong = symbol.metaTitle ? symbol.metaTitle.length > 60 : true
    const metaDescTooLong = symbol.metaDescription ? symbol.metaDescription.length > 155 : true
    const wc = wordCount(symbol.fullContent)
    const geoScore = symbol.geoScore || 0

    return {
      type: 'symbol',
      id: symbol.id,
      title: symbol.name,
      metaTitleMissingOrLong: metaTitleTooLong ? 'yes' : 'no',
      metaDescMissingOrLong: metaDescTooLong ? 'yes' : 'no',
      internalLinksZero: 'n/a',
      imagesMissingAlt: 'n/a',
      wordCount: wc,
      wordCountLow: wc < 400 ? 'yes' : 'no',
      geoScoreLow: geoScore < 50 ? 'yes' : 'no',
      focusKeywordMissing: 'n/a',
    }
  })

  console.table([...rows, ...symbolRows])
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
