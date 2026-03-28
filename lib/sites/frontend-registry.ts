export type FrontendShellVariant = 'dreamy' | 'angelic'
export type FrontendHomepageVariant = 'dreamy' | 'angelic'
export type FrontendDictionaryVariant = 'dreamy' | 'angelic'

type FrontendTemplatePack = {
  shellVariant: FrontendShellVariant
  homepageVariant: FrontendHomepageVariant
  dictionaryVariant: FrontendDictionaryVariant
}

const frontendTemplatePacks: Record<string, FrontendTemplatePack> = {
  pagani: {
    shellVariant: 'dreamy',
    homepageVariant: 'dreamy',
    dictionaryVariant: 'dreamy',
  },
  numarangelic: {
    shellVariant: 'angelic',
    homepageVariant: 'angelic',
    dictionaryVariant: 'angelic',
  },
}

export function getFrontendTemplatePack(packKey?: string | null) {
  if (!packKey) return frontendTemplatePacks.pagani
  return frontendTemplatePacks[packKey] || frontendTemplatePacks.pagani
}
