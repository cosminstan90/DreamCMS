/* eslint-disable @typescript-eslint/no-explicit-any */
import { sanitizeRichHtml } from '@/lib/security/html'

export function readingTimeFromHtml(html: string) {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  const words = text ? text.split(' ').filter(Boolean).length : 0
  const minutes = Math.max(1, Math.round(words / 200))
  return { words, minutes }
}

export function extractH2FromHtml(html: string) {
  const regex = /<h2[^>]*>(.*?)<\/h2>/gi
  const list: Array<{ id: string; text: string }> = []
  let match: RegExpExecArray | null = regex.exec(html)
  while (match) {
    const text = match[1].replace(/<[^>]*>/g, '').trim()
    if (text) {
      const id = text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
      list.push({ id, text })
    }
    match = regex.exec(html)
  }
  return list
}

export function addHeadingIds(html: string) {
  return html.replace(/<h2([^>]*)>(.*?)<\/h2>/gi, (_match, attrs, content) => {
    const text = String(content).replace(/<[^>]*>/g, '').trim()
    const id = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
    if (!id) return `<h2${attrs}>${content}</h2>`
    if (String(attrs).includes('id=')) return `<h2${attrs}>${content}</h2>`
    return `<h2${attrs} id="${id}">${content}</h2>`
  })
}

function stripUnsupportedDataNodes(html: string, allowedDataNodes?: string[]) {
  if (!allowedDataNodes || allowedDataNodes.length === 0) return html
  const allowed = new Set(allowedDataNodes)
  return html.replace(
    /<(div|aside|figure)[^>]*data-node="([^"]+)"[^>]*>[\s\S]*?<\/\1>/gi,
    (full, _tag, nodeName) => (allowed.has(String(nodeName)) ? full : ''),
  )
}

export function prepareHtmlForRendering(html: string, options?: { allowedDataNodes?: string[] }) {
  const sanitized = sanitizeRichHtml(html || '')
  const filtered = stripUnsupportedDataNodes(sanitized, options?.allowedDataNodes)
  return addHeadingIds(filtered)
}

export function parseDreamSymbols(contentJson: any): Array<{ symbolName: string; slug: string; shortMeaning?: string }> {
  const result: Array<{ symbolName: string; slug: string; shortMeaning?: string }> = []
  function walk(node: any) {
    if (!node) return
    if (node.type === 'dreamSymbolsListBlock' && Array.isArray(node.attrs?.payload?.items)) {
      result.push(...node.attrs.payload.items)
    }
    if (Array.isArray(node.content)) node.content.forEach(walk)
  }
  walk(contentJson)
  return result
}

export function parseDreamInterpretationBlocks(contentJson: any) {
  const result: Array<{
    dreamTitle?: string
    generalMeaning?: string
    psychologicalMeaning?: string
    spiritualMeaning?: string
  }> = []

  function walk(node: any) {
    if (!node) return
    if (node.type === 'dreamInterpretationBlock' && node.attrs?.payload) {
      result.push(node.attrs.payload)
    }
    if (Array.isArray(node.content)) node.content.forEach(walk)
  }

  walk(contentJson)
  return result
}

export function findCategoryPath(category: any) {
  const parts: Array<{ name: string; slug: string }> = []
  let current = category
  while (current) {
    parts.unshift({ name: current.name, slug: current.slug })
    current = current.parent || null
  }
  return parts
}
