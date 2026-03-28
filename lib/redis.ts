/**
 * lib/redis.ts
 *
 * Shared ioredis client for DreamCMS.
 * Uses Redis DB 2 so it does not collide with VelocityCMS (DB 0) or
 * FlowPoster (DB 1) running on the same Redis instance.
 *
 * Features:
 *  - Site-resolver caching (avoids a MySQL round-trip on every request)
 *  - Redis-backed rate limiting (replaces the in-memory Map in middleware)
 *
 * The client is a singleton — shared across the process with graceful
 * degradation: every helper catches errors and fails open so the app
 * keeps running even when Redis is temporarily unavailable.
 */

import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as { _dreamRedis?: Redis }

function createClient(): Redis {
  const url = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379/2'

  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      if (times > 3) return null          // stop retrying, fail open
      return Math.min(times * 200, 2000)  // 200ms, 400ms, 800ms back-off
    },
    lazyConnect: true,                    // connect only on first command
    enableOfflineQueue: false,            // don't queue commands while down
  })

  client.on('error', (err) => {
    // Suppress noisy reconnect logs — app continues without cache
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[redis] error:', err.message)
    }
  })

  return client
}

export const redis: Redis =
  globalForRedis._dreamRedis ?? createClient()

if (process.env.NODE_ENV !== 'production') {
  globalForRedis._dreamRedis = redis
}

// ── Key helpers ────────────────────────────────────────────────────────────────

/** Cache prefix — keeps DreamCMS keys identifiable in Redis DB 2 */
const PREFIX = 'dcms:'

export function key(...parts: string[]): string {
  return PREFIX + parts.join(':')
}

// ── Generic cache helpers ──────────────────────────────────────────────────────

export async function cacheGet(k: string): Promise<string | null> {
  try {
    return await redis.get(k)
  } catch {
    return null
  }
}

export async function cacheSet(
  k: string,
  value: string,
  ttlSeconds?: number
): Promise<void> {
  try {
    if (ttlSeconds) {
      await redis.set(k, value, 'EX', ttlSeconds)
    } else {
      await redis.set(k, value)
    }
  } catch {
    // silently fail — Redis is an enhancement, not a hard dependency
  }
}

export async function cacheDel(k: string): Promise<void> {
  try {
    await redis.del(k)
  } catch {
    // silently fail
  }
}

// ── Rate limiting ─────────────────────────────────────────────────────────────

/**
 * Increment a sliding counter for `key` inside `windowSeconds`.
 * Returns true  → request is within limit.
 * Returns false → limit exceeded, caller should return 429.
 *
 * Falls open (returns true) if Redis is unavailable.
 */
export async function checkRateLimit(
  rateLimitKey: string,
  max: number,
  windowSeconds: number
): Promise<boolean> {
  try {
    const current = await redis.incr(rateLimitKey)
    if (current === 1) {
      // First hit in this window — set expiry
      await redis.expire(rateLimitKey, windowSeconds)
    }
    return current <= max
  } catch {
    return true // fail open if Redis is unavailable
  }
}

// ── Site resolver cache ───────────────────────────────────────────────────────

const SITE_TTL = 5 * 60 // 5 minutes

export async function getSiteCacheKey(host: string): Promise<string> {
  return key('site', host)
}

export async function getCachedSite(host: string): Promise<string | null> {
  return cacheGet(await getSiteCacheKey(host))
}

export async function setCachedSite(host: string, payload: string): Promise<void> {
  return cacheSet(await getSiteCacheKey(host), payload, SITE_TTL)
}

/** Call this when a Site record is updated via the admin, to bust the cache. */
export async function invalidateSiteCache(host: string): Promise<void> {
  return cacheDel(await getSiteCacheKey(host))
}
