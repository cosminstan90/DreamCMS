import { timingSafeEqual } from 'crypto'

export function timingSafeEqualString(a: string, b: string) {
  const aBuf = Buffer.from(String(a))
  const bBuf = Buffer.from(String(b))
  if (!aBuf.length || aBuf.length !== bBuf.length) return false
  return timingSafeEqual(aBuf, bBuf)
}
