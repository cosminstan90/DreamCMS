import { revalidatePath } from 'next/cache'
import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { requireCurrentSiteResponse } from '@/lib/sites/context'

const META_DIR = path.join(process.cwd(), '.data')
const META_FILE = path.join(META_DIR, 'sitemap-meta.json')

type SitemapMeta = {
  lastGeneratedAt: string | null
}

type PingAttempt = {
  attempt: number
  ok: boolean
  status: number | null
  error: string | null
}

async function readMeta(): Promise<SitemapMeta> {
  try {
    const raw = await readFile(META_FILE, 'utf-8')
    return JSON.parse(raw) as SitemapMeta
  } catch {
    return { lastGeneratedAt: null }
  }
}

async function writeMeta(data: SitemapMeta) {
  await mkdir(META_DIR, { recursive: true })
  await writeFile(META_FILE, JSON.stringify(data), 'utf-8')
}

async function getUrlCount(siteId: string) {
  const [posts, symbols, categories] = await Promise.all([
    prisma.post.count({ where: { siteId, status: 'PUBLISHED' } }),
    prisma.symbolEntry.count({ where: { siteId, publishedAt: { not: null } } }),
    prisma.category.count({ where: { siteId } }),
  ])

  return 2 + 26 + categories + posts + symbols
}

async function pingWithRetry(url: string, retries = 3, timeoutMs = 5000) {
  const attempts: PingAttempt[] = []

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, { signal: controller.signal, cache: 'no-store' })
      clearTimeout(timer)
      attempts.push({ attempt, ok: response.ok, status: response.status, error: null })

      if (response.ok) {
        return {
          ok: true,
          attempts,
          message: `Ping reusit la incercarea ${attempt}.`,
        }
      }
    } catch (error) {
      clearTimeout(timer)
      attempts.push({
        attempt,
        ok: false,
        status: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return {
    ok: false,
    attempts,
    message: 'Ping esuat dupa toate incercarile.',
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { context, response } = await requireCurrentSiteResponse()
  if (response || !context) return response

  const [meta, count] = await Promise.all([readMeta(), getUrlCount(context.site.id)])
  return NextResponse.json({ lastGeneratedAt: meta.lastGeneratedAt, urlCount: count })
}

export async function POST(req: Request) {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { context, response } = await requireCurrentSiteResponse()
  if (response || !context) return response

  const body = await req.json()
  const action = String(body?.action || '')

  if (action === 'regenerate') {
    revalidatePath('/')
    revalidatePath('/dictionar')
    revalidatePath('/sitemap.xml')
    revalidatePath('/sitemap-images.xml')
    revalidatePath('/robots.txt')
    revalidatePath('/feed.xml')

    const now = new Date().toISOString()
    await writeMeta({ lastGeneratedAt: now })
    const urlCount = await getUrlCount(context.site.id)
    return NextResponse.json({ ok: true, lastGeneratedAt: now, urlCount, message: 'Sitemap regenerat.' })
  }

  if (action === 'ping-google') {
    const siteUrl = (context.seoSettings?.siteUrl || context.site.siteUrl || 'https://candvisam.ro').replace(/\/$/, '')
    const target = `${siteUrl}/sitemap.xml`
    const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(target)}`
    const result = await pingWithRetry(pingUrl)
    return NextResponse.json(result)
  }

  if (action === 'ping-bing') {
    const siteUrl = (context.seoSettings?.siteUrl || context.site.siteUrl || 'https://candvisam.ro').replace(/\/$/, '')
    const target = `${siteUrl}/sitemap.xml`
    const pingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(target)}`
    const result = await pingWithRetry(pingUrl)
    return NextResponse.json(result)
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
