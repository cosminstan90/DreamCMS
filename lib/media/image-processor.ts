/* eslint-disable @typescript-eslint/no-explicit-any */
import sharp from 'sharp'

const DEFAULT_WEBP_QUALITY = 85

export type ProcessedImage = {
  webp: Buffer
  thumbnail: Buffer
  ogImage: Buffer
  width: number
  height: number
}

export async function processImage(input: Buffer): Promise<ProcessedImage> {
  const base = sharp(input)
  const metadata = await base.metadata()

  const width = metadata.width || 0
  const height = metadata.height || 0

  const webp = await base.clone().webp({ quality: DEFAULT_WEBP_QUALITY }).toBuffer()
  const thumbnail = await base.clone().resize({ width: 400 }).webp({ quality: DEFAULT_WEBP_QUALITY }).toBuffer()
  const ogImage = await base.clone().resize({ width: 1200, height: 630, fit: 'cover' }).webp({ quality: DEFAULT_WEBP_QUALITY }).toBuffer()

  return { webp, thumbnail, ogImage, width, height }
}

async function callClaude(prompt: string, apiKey: string) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 100,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) return ''
  const data: any = await response.json()
  const text = data?.content?.[0]?.text || ''
  return String(text).trim()
}

export async function generateAltText(description: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return ''

  const prompt = `Genereaza un text ALT in romana, max 10 cuvinte, stil oniric specific pagani.ro. Fii concret (ex: "femeie care viseaza sub luna plina"). Descriere: ${description}`
  const result = await callClaude(prompt, apiKey)
  return result.split(' ').slice(0, 10).join(' ')
}

export function addImageAttributes(html: string) {
  let index = 0
  return html.replace(/<img\s+([^>]+)>/gi, (match, attrs) => {
    index += 1
    const hasLoading = /loading=/.test(attrs)
    const loadingAttr = hasLoading ? '' : ` loading="${index === 1 ? 'eager' : 'lazy'}"`
    return `<img ${attrs}${loadingAttr}>`
  })
}
