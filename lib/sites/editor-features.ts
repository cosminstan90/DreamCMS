import type { EditorBlockKey, EditorPanelKey, SitePackEditorFeatures } from '@/lib/sites/types'

export const ALL_EDITOR_BLOCKS: EditorBlockKey[] = [
  'imageGallery',
  'quickAnswer',
  'dreamInterpretation',
  'prosConsMeaning',
  'whenToWorry',
  'expertTake',
  'symbolCard',
  'faq',
  'dreamSymbolsList',
  'callout',
]

export const SYMBOL_EDITOR_BLOCKS: EditorBlockKey[] = [
  'imageGallery',
  'quickAnswer',
  'prosConsMeaning',
  'whenToWorry',
  'expertTake',
  'symbolCard',
  'faq',
  'callout',
]

export const DEFAULT_EDITOR_PANELS: EditorPanelKey[] = ['seo', 'geo', 'links']

export const DEFAULT_SITE_EDITOR_FEATURES: SitePackEditorFeatures = {
  postBlocks: ALL_EDITOR_BLOCKS,
  symbolBlocks: SYMBOL_EDITOR_BLOCKS,
  postPanels: DEFAULT_EDITOR_PANELS,
  symbolPanels: DEFAULT_EDITOR_PANELS,
  allowTopicClusters: true,
  allowFeaturedImage: true,
  allowRelatedSymbols: true,
  allowRevisionHistory: true,
}
