import { readFile, writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { timingSafeEqualString as safeCompare } from '@/lib/security/secrets'

const TOKEN_FILE = path.join(process.cwd(), '.data', 'publisher-token.json')

type TokenStore = { token: string }

export async function getPublisherToken() {
  const envToken = process.env.CMS_PUBLISHER_TOKEN
  if (envToken) return envToken

  try {
    const raw = await readFile(TOKEN_FILE, 'utf-8')
    const data = JSON.parse(raw) as TokenStore
    return data.token
  } catch {
    return ''
  }
}

export async function regeneratePublisherToken() {
  const token = randomUUID().replace(/-/g, '')
  await mkdir(path.dirname(TOKEN_FILE), { recursive: true })
  await writeFile(TOKEN_FILE, JSON.stringify({ token }), 'utf-8')
  return token
}

export function timingSafeEqualString(a: string, b: string) {
  return safeCompare(a, b)
}
