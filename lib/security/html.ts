const BLOCKED_TAGS = ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', 'meta']

function stripBlockedTags(html: string) {
  return BLOCKED_TAGS.reduce((acc, tag) => {
    const pair = new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi')
    const selfClosing = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi')
    return acc.replace(pair, '').replace(selfClosing, '')
  }, html)
}

export function sanitizeRichHtml(html: string) {
  if (!html) return ''

  return stripBlockedTags(String(html))
    .replace(/\son[a-z-]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, '')
    .replace(/\sstyle\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, '')
    .replace(/\ssrcdoc\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, '')
    .replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, ' $1="#"')
    .replace(/\s(href|src)\s*=\s*(['"])\s*data:text\/html[\s\S]*?\2/gi, ' $1="#"')
}
