/* eslint-disable @typescript-eslint/no-explicit-any */

function stripHtml(input: string) {
  return input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function extractH2Titles(contentHtml: string) {
  const regex = /<h2[^>]*>([\s\S]*?)<\/h2>/gi
  const titles: string[] = []
  let match = regex.exec(contentHtml)
  while (match) {
    const value = stripHtml(match[1] || '')
    if (value) titles.push(value)
    match = regex.exec(contentHtml)
  }
  return titles
}

function extractPriorityTitles(contentJson: any) {
  const titles: string[] = []
  function walk(node: any) {
    if (!node) return
    if (node.type === 'dreamInterpretationBlock' && node.attrs?.payload) {
      if (node.attrs.payload.generalMeaning) titles.push('Interpretare generala')
      if (node.attrs.payload.psychologicalMeaning) titles.push('Semnificatie psihologica')
      if (node.attrs.payload.spiritualMeaning) titles.push('Semnificatie spirituala')
    }
    if (node.type === 'quickAnswerBlock' && node.attrs?.payload?.answer) {
      titles.push('Raspuns rapid')
    }
    if (node.type === 'prosConsMeaningBlock' && node.attrs?.payload) {
      titles.push('Cand e pozitiv vs negativ')
    }
    if (node.type === 'whenToWorryBlock' && node.attrs?.payload) {
      titles.push('Cand sa te ingrijorezi')
    }
    if (node.type === 'expertTakeBlock' && node.attrs?.payload?.take) {
      titles.push('Perspectiva de expert')
    }
    if (Array.isArray(node.content)) node.content.forEach(walk)
  }
  walk(contentJson)
  return titles
}

export function buildSpeakableSections(contentHtml?: string | null, contentJson?: unknown) {
  const h2Titles = extractH2Titles(String(contentHtml || ''))
  const priorityTitles = extractPriorityTitles(contentJson as any)
  return Array.from(new Set([...priorityTitles, ...h2Titles]))
}

export function buildSpeakableSpecification(
  sections: string[],
  options?: { isDreamInterpretation?: boolean; hasVisibleSummary?: boolean },
) {
  if (!sections.length) return undefined
  if (!options?.hasVisibleSummary && sections.length < 2) return undefined

  const prioritized = options?.isDreamInterpretation
    ? [
        ...sections.filter((item) => item === 'Raspuns rapid' || item === 'Interpretare generala' || item === 'Semnificatie psihologica'),
        ...sections.filter((item) => item !== 'Raspuns rapid' && item !== 'Interpretare generala' && item !== 'Semnificatie psihologica'),
      ]
    : sections

  return {
    '@type': 'SpeakableSpecification',
    cssSelector: prioritized.map((title) => `[data-speakable-title="${title}"]`),
  }
}
