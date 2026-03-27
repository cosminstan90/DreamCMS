import type { HomepageSectionKey, SiteHomepageSection } from '@/lib/sites/types'

const VALID_SECTION_KEYS = new Set<HomepageSectionKey>([
  'hero',
  'latestPosts',
  'categories',
  'featuredSymbols',
  'newsletter',
])

function coerceSection(value: unknown): SiteHomepageSection | null {
  if (typeof value !== 'object' || value === null) return null

  const candidate = value as Record<string, unknown>
  const key = String(candidate.key || '') as HomepageSectionKey
  if (!VALID_SECTION_KEYS.has(key)) return null

  return {
    key,
    enabled: candidate.enabled !== false,
    title: typeof candidate.title === 'string' ? candidate.title : undefined,
    subtitle: typeof candidate.subtitle === 'string' ? candidate.subtitle : undefined,
    limit:
      typeof candidate.limit === 'number' && Number.isFinite(candidate.limit)
        ? Math.max(1, Math.min(24, Math.round(candidate.limit)))
        : undefined,
  }
}

export function normalizeHomepageSections(
  value: unknown,
  fallback: SiteHomepageSection[],
): SiteHomepageSection[] {
  const parsed = Array.isArray(value)
    ? value.map(coerceSection).filter((item): item is SiteHomepageSection => Boolean(item))
    : []

  if (parsed.length === 0) {
    return fallback
  }

  const used = new Set(parsed.map((item) => item.key))
  const missing = fallback.filter((item) => !used.has(item.key))
  return [...parsed, ...missing]
}
