export type FrontendShellVariant = 'dreamy' | 'angelic'
export type FrontendHomepageVariant = 'dreamy' | 'angelic'
export type FrontendDictionaryVariant = 'dreamy' | 'angelic'

type FrontendTemplatePack = {
  shellVariant: FrontendShellVariant
  homepageVariant: FrontendHomepageVariant
  dictionaryVariant: FrontendDictionaryVariant
}

const frontendTemplatePacks: Record<string, FrontendTemplatePack> = {
  candvisam: {
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
  if (!packKey) return frontendTemplatePacks.candvisam
  return frontendTemplatePacks[packKey] || frontendTemplatePacks.candvisam
}
