import type { EditorBlockKey } from '@/lib/sites/types'

export type BlockCategory = 'core' | 'vertical'

export type BlockRegistryItem = {
  key: EditorBlockKey
  nodeName: string
  label: string
  category: BlockCategory
}

export const BLOCK_REGISTRY: Record<EditorBlockKey, BlockRegistryItem> = {
  imageGallery: {
    key: 'imageGallery',
    nodeName: 'imageGalleryBlock',
    label: 'Galerie imagini',
    category: 'core',
  },
  faq: {
    key: 'faq',
    nodeName: 'faqBlock',
    label: 'FAQ',
    category: 'core',
  },
  callout: {
    key: 'callout',
    nodeName: 'calloutBlock',
    label: 'Nota',
    category: 'core',
  },
  quickAnswer: {
    key: 'quickAnswer',
    nodeName: 'quickAnswerBlock',
    label: 'Raspuns rapid',
    category: 'core',
  },
  expertTake: {
    key: 'expertTake',
    nodeName: 'expertTakeBlock',
    label: 'Perspectiva de expert',
    category: 'core',
  },
  prosConsMeaning: {
    key: 'prosConsMeaning',
    nodeName: 'prosConsMeaningBlock',
    label: 'Sens pozitiv/negativ',
    category: 'core',
  },
  dreamInterpretation: {
    key: 'dreamInterpretation',
    nodeName: 'dreamInterpretationBlock',
    label: 'Interpretare vis',
    category: 'vertical',
  },
  symbolCard: {
    key: 'symbolCard',
    nodeName: 'symbolCardBlock',
    label: 'Simbol card',
    category: 'vertical',
  },
  dreamSymbolsList: {
    key: 'dreamSymbolsList',
    nodeName: 'dreamSymbolsListBlock',
    label: 'Lista simboluri',
    category: 'vertical',
  },
  whenToWorry: {
    key: 'whenToWorry',
    nodeName: 'whenToWorryBlock',
    label: 'Cand sa te ingrijorezi',
    category: 'vertical',
  },
}

export function getAllowedNodeNames(blocks: EditorBlockKey[]) {
  return blocks
    .map((key) => BLOCK_REGISTRY[key]?.nodeName)
    .filter((value): value is string => Boolean(value))
}
