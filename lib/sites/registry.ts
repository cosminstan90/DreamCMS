import { candvisamSitePack } from '@/lib/sites/packs/candvisam'
import { numarAngelicSitePack } from '@/lib/sites/packs/numarangelic'
import type { SitePack } from '@/lib/sites/types'

const packs: Record<string, SitePack> = {
  candvisam: candvisamSitePack,
  numarangelic: numarAngelicSitePack,
}

export function getSitePack(key?: string | null) {
  if (!key) return candvisamSitePack
  return packs[key] || candvisamSitePack
}
