import { getAllowedNodeNames } from '@/lib/editor/block-registry'
import { getSitePack } from '@/lib/sites/registry'

export function getAllowedDataNodesForSitePack(
  packKey: string | null | undefined,
  kind: 'post' | 'symbol',
) {
  const pack = getSitePack(packKey)
  const blocks = kind === 'post' ? pack.features.editor.postBlocks : pack.features.editor.symbolBlocks
  return getAllowedNodeNames(blocks)
}
