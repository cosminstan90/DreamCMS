import { paganiSitePack } from '@/lib/sites/packs/pagani'
import { numarAngelicSitePack } from '@/lib/sites/packs/numarangelic'
import type { SitePack } from '@/lib/sites/types'

const packs: Record<string, SitePack> = {
  pagani: paganiSitePack,
  numarangelic: numarAngelicSitePack,
}

export function getSitePack(key?: string | null) {
  if (!key) return paganiSitePack
  return packs[key] || paganiSitePack
}
