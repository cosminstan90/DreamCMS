import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/prisma'

type RedirectEntry = {
  id: string
  toPath: string
  statusCode: number
}

const CACHE_FILE = path.join(process.cwd(), '.data', 'redirects-cache.json')
let cache: Map<string, RedirectEntry> | null = null
let lastLoadedAt = 0

function normalizeHost(value: string | null | undefined) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/:\d+$/, '')
    .replace(/\/$/, '')
}

function buildCacheKey(host: string, pathname: string) {
  return `${normalizeHost(host)}:${pathname}`
}

async function readFromDisk() {
  try {
    const raw = await readFile(CACHE_FILE, 'utf-8')
    const parsed = JSON.parse(raw) as Record<string, RedirectEntry>
    return new Map(Object.entries(parsed))
  } catch {
    return null
  }
}

async function writeToDisk(map: Map<string, RedirectEntry>) {
  await mkdir(path.dirname(CACHE_FILE), { recursive: true })
  const obj: Record<string, RedirectEntry> = {}
  const entries = Array.from(map.entries())
  for (let i = 0; i < entries.length; i += 1) {
    const [key, value] = entries[i]
    obj[key] = value
  }
  await writeFile(CACHE_FILE, JSON.stringify(obj), 'utf-8')
}

async function loadFromDb() {
  const rows = await prisma.redirect.findMany({
    where: { isActive: true },
    select: {
      id: true,
      fromPath: true,
      toPath: true,
      statusCode: true,
      site: {
        select: { primaryDomain: true, secondaryDomains: true },
      },
    },
  })
  const map = new Map<string, RedirectEntry>()
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]
    const domains = [row.site.primaryDomain]
    if (Array.isArray(row.site.secondaryDomains)) {
      domains.push(...row.site.secondaryDomains.map((item) => String(item)))
    }

    for (let j = 0; j < domains.length; j += 1) {
      const host = normalizeHost(domains[j])
      if (!host) continue
      map.set(buildCacheKey(host, row.fromPath), { id: row.id, toPath: row.toPath, statusCode: row.statusCode })
    }
  }
  cache = map
  lastLoadedAt = Date.now()
  await writeToDisk(map)
  return map
}

export async function warmRedirectCache() {
  if (cache && Date.now() - lastLoadedAt < 60_000) return cache
  const disk = await readFromDisk()
  if (disk) {
    cache = disk
    lastLoadedAt = Date.now()
    return cache
  }
  return loadFromDb()
}

export async function invalidateRedirectCache() {
  cache = null
  lastLoadedAt = 0
  await loadFromDb()
}

export async function getRedirectForPath(pathname: string, host: string) {
  const normalizedHost = normalizeHost(host)
  const map = await warmRedirectCache()
  const key = buildCacheKey(normalizedHost, pathname)
  const hit = map.get(key)
  if (hit) return hit

  const rows = await prisma.redirect.findMany({
    where: { fromPath: pathname, isActive: true },
    select: {
      id: true,
      toPath: true,
      statusCode: true,
      site: { select: { primaryDomain: true, secondaryDomains: true } },
    },
  })
  const row = rows.find((item) => {
    const domains = [item.site.primaryDomain]
    if (Array.isArray(item.site.secondaryDomains)) {
      domains.push(...item.site.secondaryDomains.map((value) => String(value)))
    }
    return domains.map(normalizeHost).includes(normalizedHost)
  })
  if (row) {
    map.set(key, { id: row.id, toPath: row.toPath, statusCode: row.statusCode })
    await writeToDisk(map)
    return { id: row.id, toPath: row.toPath, statusCode: row.statusCode }
  }

  return null
}
