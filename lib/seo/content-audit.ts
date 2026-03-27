/* eslint-disable @typescript-eslint/no-explicit-any */

export function stripHtml(input: string) {
  return input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function wordCountFromHtml(html: string) {
  const text = stripHtml(html || '')
  return text ? text.split(' ').filter(Boolean).length : 0
}

export function countInternalLinks(html: string) {
  return (html.match(/<a[^>]+href=["'](\/|https?:\/\/(www\.)?candvisam\.ro)[^"']*["'][^>]*>/gi) || []).length
}

export function extractInternalLinks(html: string) {
  return Array.from(
    new Set(
      (html.match(/href=["']((\/|https?:\/\/(www\.)?candvisam\.ro)[^"']*)["']/gi) || [])
        .map((entry) => entry.replace(/^href=["']/, '').replace(/["']$/, '')),
    ),
  )
}

export function countImagesMissingAlt(html: string) {
  return (html.match(/<img[^>]+>/gi) || []).filter((img) => !/alt=/.test(img)).length
}

export function extractFirstParagraph(html: string) {
  const match = html.match(/<p[^>]*>(.*?)<\/p>/i)
  return match ? stripHtml(match[1]) : ''
}

export function hasNodeType(contentJson: any, type: string) {
  let found = false
  function walk(node: any) {
    if (!node || found) return
    if (node.type === type) {
      found = true
      return
    }
    if (Array.isArray(node.content)) node.content.forEach(walk)
  }
  walk(contentJson)
  return found
}

export function hasFaqBlock(contentJson: any) {
  return hasNodeType(contentJson, 'faqBlock')
}

export function hasDreamSymbolsList(contentJson: any) {
  return hasNodeType(contentJson, 'dreamSymbolsListBlock')
}

