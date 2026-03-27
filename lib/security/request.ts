import { lookup } from 'dns/promises'
import net from 'net'

const PRIVATE_IPV4_RANGES = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
]

function isPrivateHostname(hostname: string) {
  const normalized = hostname.trim().toLowerCase()
  return normalized === 'localhost' || normalized.endsWith('.localhost') || normalized.endsWith('.local')
}

function isPrivateIpAddress(ip: string) {
  if (net.isIPv4(ip)) return PRIVATE_IPV4_RANGES.some((pattern) => pattern.test(ip))
  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase()
    return normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80:')
  }
  return false
}

export function sanitizeCallbackUrl(value: string | null | undefined, fallback = '/admin/dashboard') {
  const input = String(value || '').trim()
  if (!input.startsWith('/')) return fallback
  if (input.startsWith('//')) return fallback
  return input
}

export function clampInteger(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.trunc(value)))
}

export async function assertSafeRemoteUrl(rawUrl: string) {
  let parsed: URL

  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new Error('Invalid remote URL')
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Unsupported protocol')
  }

  if (parsed.username || parsed.password) {
    throw new Error('Credentials not allowed in URL')
  }

  if (isPrivateHostname(parsed.hostname) || isPrivateIpAddress(parsed.hostname)) {
    throw new Error('Private hosts are not allowed')
  }

  const resolved = await lookup(parsed.hostname, { all: true })
  if (!resolved.length || resolved.some((entry) => isPrivateIpAddress(entry.address))) {
    throw new Error('Unsafe target host')
  }

  return parsed.toString()
}
