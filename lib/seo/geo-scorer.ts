/* eslint-disable @typescript-eslint/no-explicit-any */

export type GeoFactor = {
  key:
    | 'summaryBlock'
    | 'answerFirstIntro'
    | 'speakableSections'
    | 'structuredQa'
    | 'semanticContrast'
    | 'sourceBackedClaims'
    | 'snippetQuality'
    | 'definitionClarity'
    | 'dreamCompleteness'
    | 'authorCredibility'
    | 'dataAndStatistics'
    | 'citationReady'
  label: string
  score: number
  maxScore: number
  passed: boolean
  details?: string
}

export type SnippetCandidate = {
  label: string
  text: string
  source: 'intro' | 'quickAnswer' | 'definition' | 'faq' | 'expertTake' | 'summary'
  score: number
}

export type GeoResult = {
  score: number
  breakdown: GeoFactor[]
  suggestions: string[]
  warnings: string[]
  directAnswer: string | null
  speakableSections: string[]
  snippetCandidates: SnippetCandidate[]
  llmSummary: string | null
  citationReadiness: 'Scazuta' | 'Medie' | 'Ridicata' | 'Foarte Ridicata'
  answerQualityLevel: 'Slaba' | 'Buna' | 'Puternica' | 'Excelenta'
  aiCitability: 'Scazut' | 'Mediu' | 'Ridicat' | 'Foarte Ridicat'
}

type PostLike = {
  title?: string | null
  slug?: string | null
  excerpt?: string | null
  name?: string | null
  focusKeyword?: string | null
  contentHtml?: string | null
  contentJson?: unknown
  postType?: 'ARTICLE' | 'DREAM_INTERPRETATION' | 'SYMBOL' | string | null
  shortDefinition?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
}

type AuthorLike = {
  name?: string | null
  credentials?: string | null
}

type ParsedBlocks = {
  faqItems: Array<{ question: string; answer: string }>
  dreamInterpretations: Array<{ dreamTitle?: string; generalMeaning?: string; psychologicalMeaning?: string; spiritualMeaning?: string }>
  symbolCards: Array<{ contexts?: Array<{ context?: string; meaning?: string }> }>
  dreamSymbols: Array<{ symbolName?: string; slug?: string }>
  quickAnswers: Array<{ question?: string; answer?: string; supportingDetail?: string }>
  prosCons: Array<{ positiveMeaning?: string; cautionMeaning?: string; contextsSummary?: string }>
  whenToWorry: Array<{ signs?: string[]; reassurance?: string }>
  expertTakes: Array<{ expertName?: string; expertRole?: string; take?: string; confidence?: string }>
}

function stripHtml(input: string) {
  return input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function wordCount(input: string) {
  return stripHtml(input)
    .split(/\s+/)
    .filter(Boolean).length
}

function sentenceCount(input: string) {
  return stripHtml(input)
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean).length
}

function firstParagraph(html: string) {
  const match = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i)
  return match ? stripHtml(match[1]) : ''
}

function extractH2Titles(html: string) {
  const regex = /<h2[^>]*>([\s\S]*?)<\/h2>/gi
  const list: string[] = []
  let match = regex.exec(html)
  while (match) {
    const title = stripHtml(match[1] || '')
    if (title) list.push(title)
    match = regex.exec(html)
  }
  return list
}

function firstWords(input: string, limit: number) {
  return stripHtml(input).split(/\s+/).filter(Boolean).slice(0, limit).join(' ')
}

function normalizeText(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function containsKeyword(text: string, keyword: string) {
  if (!keyword) return false
  return normalizeText(text).includes(normalizeText(keyword))
}

function clampWords(text: string, maxWords: number) {
  return stripHtml(text).split(/\s+/).filter(Boolean).slice(0, maxWords).join(' ')
}

function extractBlocks(contentJson: any): ParsedBlocks {
  const result: ParsedBlocks = {
    faqItems: [],
    dreamInterpretations: [],
    symbolCards: [],
    dreamSymbols: [],
    quickAnswers: [],
    prosCons: [],
    whenToWorry: [],
    expertTakes: [],
  }

  function walk(node: any) {
    if (!node) return
    if (node.type === 'faqBlock' && Array.isArray(node.attrs?.payload?.items)) {
      result.faqItems.push(...node.attrs.payload.items)
    }
    if (node.type === 'dreamInterpretationBlock' && node.attrs?.payload) {
      result.dreamInterpretations.push(node.attrs.payload)
    }
    if (node.type === 'symbolCardBlock' && node.attrs?.payload) {
      result.symbolCards.push(node.attrs.payload)
    }
    if (node.type === 'dreamSymbolsListBlock' && Array.isArray(node.attrs?.payload?.items)) {
      result.dreamSymbols.push(...node.attrs.payload.items)
    }
    if (node.type === 'quickAnswerBlock' && node.attrs?.payload) {
      result.quickAnswers.push(node.attrs.payload)
    }
    if (node.type === 'prosConsMeaningBlock' && node.attrs?.payload) {
      result.prosCons.push(node.attrs.payload)
    }
    if (node.type === 'whenToWorryBlock' && node.attrs?.payload) {
      result.whenToWorry.push(node.attrs.payload)
    }
    if (node.type === 'expertTakeBlock' && node.attrs?.payload) {
      result.expertTakes.push(node.attrs.payload)
    }
    if (Array.isArray(node.content)) node.content.forEach(walk)
  }

  walk(contentJson)
  return result
}

function getKeyword(post: PostLike) {
  const explicit = String(post.focusKeyword || '').trim()
  if (explicit) return explicit.toLowerCase()
  const base = String(post.title || post.name || '')
    .trim()
    .toLowerCase()
  return base.split(/\s+/).slice(0, 3).join(' ')
}

function getSpeakableSections(html: string, blocks: ParsedBlocks) {
  const h2Titles = extractH2Titles(html)
  const blockTitles: string[] = []
  for (const block of blocks.dreamInterpretations) {
    if (block.generalMeaning) blockTitles.push('Interpretare generala')
    if (block.psychologicalMeaning) blockTitles.push('Semnificatie psihologica')
    if (block.spiritualMeaning) blockTitles.push('Semnificatie spirituala')
  }
  if (blocks.quickAnswers.length) blockTitles.push('Raspuns rapid')
  if (blocks.prosCons.length) blockTitles.push('Cand e pozitiv vs negativ')
  if (blocks.whenToWorry.length) blockTitles.push('Cand sa te ingrijorezi')
  if (blocks.expertTakes.length) blockTitles.push('Perspectiva de expert')
  return Array.from(new Set([...h2Titles, ...blockTitles]))
}

function buildSnippetCandidates(post: PostLike, html: string, blocks: ParsedBlocks, keyword: string, directAnswer: string) {
  const candidates: SnippetCandidate[] = []

  if (directAnswer && wordCount(directAnswer) <= 80) {
    candidates.push({
      label: 'Intro answer-first',
      text: clampWords(directAnswer, 55),
      source: 'intro',
      score: containsKeyword(directAnswer, keyword) ? 88 : 72,
    })
  }

  for (const block of blocks.quickAnswers) {
    if (block.answer) {
      candidates.push({
        label: block.question ? `Quick answer: ${block.question}` : 'Quick answer',
        text: clampWords(block.answer, 55),
        source: 'quickAnswer',
        score: containsKeyword(block.answer, keyword) ? 94 : 84,
      })
    }
  }

  if (post.postType === 'SYMBOL' && post.shortDefinition) {
    candidates.push({
      label: 'Definitie scurta',
      text: clampWords(post.shortDefinition, 45),
      source: 'definition',
      score: containsKeyword(post.shortDefinition, keyword) ? 90 : 78,
    })
  }

  const bestFaq = blocks.faqItems
    .map((item) => ({
      label: item.question || 'FAQ',
      text: clampWords(item.answer || '', 45),
      source: 'faq' as const,
      score: wordCount(item.answer || '') <= 50 ? 82 : 65,
    }))
    .filter((item) => item.text)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)

  candidates.push(...bestFaq)

  for (const expert of blocks.expertTakes) {
    if (expert.take) {
      candidates.push({
        label: expert.expertName ? `Expert take: ${expert.expertName}` : 'Expert take',
        text: clampWords(expert.take, 50),
        source: 'expertTake',
        score: expert.expertRole ? 86 : 74,
      })
    }
  }

  const summarySource = blocks.quickAnswers[0]?.supportingDetail || blocks.prosCons[0]?.contextsSummary || post.metaDescription || ''
  if (summarySource) {
    candidates.push({
      label: 'Rezumat editorial',
      text: clampWords(summarySource, 50),
      source: 'summary',
      score: containsKeyword(summarySource, keyword) ? 80 : 68,
    })
  }

  return candidates
    .filter((item) => item.text && wordCount(item.text) >= 6)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
}

function buildLlmSummary(post: PostLike, snippetCandidates: SnippetCandidate[], blocks: ParsedBlocks) {
  const base = snippetCandidates[0]?.text || post.metaDescription || post.shortDefinition || ''
  const contrast = blocks.prosCons[0]
  const expertTake = blocks.expertTakes[0]?.take
  const parts = [base]

  if (contrast?.positiveMeaning && contrast?.cautionMeaning) {
    parts.push(`Poate indica atat ${clampWords(contrast.positiveMeaning, 10)}, cat si ${clampWords(contrast.cautionMeaning, 10)}.`)
  } else if (expertTake) {
    parts.push(clampWords(expertTake, 16))
  }

  const summary = clampWords(parts.filter(Boolean).join(' '), 60)
  return summary || null
}

export function calculateGeoScore(post: PostLike, author?: AuthorLike): GeoResult {
  const html = String(post.contentHtml || '')
  const blocks = extractBlocks(post.contentJson)
  const keyword = getKeyword(post)
  const directAnswerParagraph = firstParagraph(html)
  const quickAnswer = blocks.quickAnswers[0]?.answer ? stripHtml(blocks.quickAnswers[0].answer || '') : ''
  const directAnswer = quickAnswer || directAnswerParagraph || null
  const directAnswerWordCount = wordCount(directAnswer || '')
  const speakableSections = getSpeakableSections(html, blocks)
  const snippetCandidates = buildSnippetCandidates(post, html, blocks, keyword, directAnswer || '')
  const llmSummary = buildLlmSummary(post, snippetCandidates, blocks)
  const first80 = firstWords(html, 80)

  const factors: GeoFactor[] = []
  const suggestions: string[] = []
  const warnings: string[] = []

  const summaryPresent = Boolean(blocks.quickAnswers.length || (llmSummary && wordCount(llmSummary) >= 12))
  factors.push({
    key: 'summaryBlock',
    label: 'Summary Block',
    score: summaryPresent ? 8 : 0,
    maxScore: 8,
    passed: summaryPresent,
    details: summaryPresent ? 'Quick answer sau rezumat disponibil' : 'Lipseste un bloc de sumar clar',
  })
  if (!summaryPresent) {
    suggestions.push('Adauga un QuickAnswerBlock sau un rezumat editorial clar pentru a creste sansele de citare rapida.')
  }

  const answerFirstIntro = Boolean(directAnswer && directAnswerWordCount <= 60 && containsKeyword(directAnswer, keyword))
  factors.push({
    key: 'answerFirstIntro',
    label: 'Answer-first Intro',
    score: answerFirstIntro ? 12 : directAnswer ? 6 : 0,
    maxScore: 12,
    passed: answerFirstIntro,
    details: directAnswer || 'Lipseste un intro answer-first.',
  })
  if (!answerFirstIntro) {
    suggestions.push('Primul raspuns trebuie sa vina imediat, in sub 60 de cuvinte, cu keyword-ul sau simbolul explicit.')
  }

  const hasSpeakable = speakableSections.length >= 3
  factors.push({
    key: 'speakableSections',
    label: 'Speakable Sections',
    score: hasSpeakable ? 10 : speakableSections.length > 0 ? 5 : 0,
    maxScore: 10,
    passed: hasSpeakable,
    details: `${speakableSections.length} sectiuni detectate`,
  })
  if (!hasSpeakable) {
    suggestions.push('Adauga cel putin 3 sectiuni clare, cu titluri H2 sau blocuri GEO dedicate, pentru AI Overviews si voice answers.')
  }

  const faqCount = blocks.faqItems.length
  const avgFaqAnswerWords = faqCount > 0
    ? Math.round(blocks.faqItems.reduce((acc, item) => acc + wordCount(item.answer || ''), 0) / faqCount)
    : 0
  const faqOk = faqCount >= 5 && avgFaqAnswerWords > 0 && avgFaqAnswerWords <= 55
  factors.push({
    key: 'structuredQa',
    label: 'Structured Q&A',
    score: faqOk ? 10 : faqCount >= 3 ? 5 : 0,
    maxScore: 10,
    passed: faqOk,
    details: `${faqCount} intrebari, medie ${avgFaqAnswerWords} cuvinte/raspuns`,
  })
  if (!faqOk) {
    suggestions.push('Adauga FAQBlock cu minimum 5 intrebari utile pentru utilizatorii care cauta interpretari rapide.')
  }

  const semanticContrast = Boolean(
    blocks.prosCons.length || /(pozitiv|negativ|cand e bine|cand e rau|avantaje|dezavantaje|pe de o parte|pe de alta parte)/i.test(stripHtml(html)),
  )
  factors.push({
    key: 'semanticContrast',
    label: 'Semantic Contrast',
    score: semanticContrast ? 8 : 0,
    maxScore: 8,
    passed: semanticContrast,
    details: semanticContrast ? 'Exista contraste utile pentru interpretare' : 'Lipsesc contraste semantice explicite',
  })
  if (!semanticContrast) {
    suggestions.push('Adauga un ProsConsMeaningBlock pentru a separa clar sensurile pozitive, negative sau contextuale ale visului.')
  }

  const numericContextRegex = /(\d+([.,]\d+)?\s?(%|procente?|persoane?|cazuri?|studii?|surse?|ani?|luni?))/gi
  const sourceSignals = /(studiu|cercetare|sursa|conform|potrivit|research|journal|specialist|expert)/i.test(stripHtml(html))
  const sourceBacked = sourceSignals || numericContextRegex.test(stripHtml(html)) || blocks.expertTakes.length > 0
  factors.push({
    key: 'sourceBackedClaims',
    label: 'Source-backed Claims Readiness',
    score: sourceBacked ? 8 : 0,
    maxScore: 8,
    passed: sourceBacked,
    details: sourceBacked ? 'Exista indicii de sustinere sau expertiza' : 'Afirmatiile par insuficient sustinute',
  })
  if (!sourceBacked) {
    suggestions.push('Completeaza continutul cu formule de tip "conform" sau cu un ExpertTakeBlock pentru a creste increderea LLM-urilor.')
  }

  const snippetQuality = snippetCandidates.length > 0 && snippetCandidates[0].score >= 80
  factors.push({
    key: 'snippetQuality',
    label: 'Snippet Candidate Quality',
    score: snippetQuality ? 10 : snippetCandidates.length >= 2 ? 5 : 0,
    maxScore: 10,
    passed: snippetQuality,
    details: snippetCandidates.length ? `${snippetCandidates.length} candidați detectati` : 'Nu exista snippet candidates bune',
  })
  if (!snippetQuality) {
    suggestions.push('Scrie un raspuns scurt, autosuficient si citabil. QuickAnswerBlock este cea mai rapida cale spre snippets mai bune.')
  }

  const definitionClarity = post.postType === 'SYMBOL'
    ? containsKeyword(first80, String(post.name || '')) && /(este|inseamna|reprezinta|simbolizeaza)/i.test(first80)
    : containsKeyword(first80, keyword) && /(vis|interpretare|simbol|inseamna|sugereaza)/i.test(first80)
  factors.push({
    key: 'definitionClarity',
    label: 'Definition Clarity (first 80 words)',
    score: definitionClarity ? 8 : 0,
    maxScore: 8,
    passed: definitionClarity,
    details: first80 || 'Nu exista suficient continut introductiv.',
  })
  if (!definitionClarity) {
    suggestions.push('Clarifica definitia in primele 80 de cuvinte. Pentru simboluri: "X inseamna...". Pentru vise: "Cand visezi X...".')
  }

  const completeDreamBlock = blocks.dreamInterpretations.some(
    (item) => item.generalMeaning && item.psychologicalMeaning && item.spiritualMeaning,
  )
  const completeSymbolCard = blocks.symbolCards.some((item) => Array.isArray(item.contexts) && item.contexts.length >= 2)
  const dreamComplete = completeDreamBlock || completeSymbolCard || blocks.prosCons.length > 0
  factors.push({
    key: 'dreamCompleteness',
    label: 'Dream-specific Completeness',
    score: dreamComplete ? 8 : 0,
    maxScore: 8,
    passed: dreamComplete,
    details: dreamComplete ? 'Structura oneirica este bine acoperita' : 'Lipsesc blocuri specifice oneirice',
  })
  if (!dreamComplete) {
    suggestions.push('Pentru pagani.ro, combina QuickAnswerBlock cu DreamInterpretationBlock sau ProsConsMeaningBlock pentru structura completa.')
  }

  const authorName = String(author?.name || '').trim()
  const credentials =
    String(author?.credentials || '').trim() ||
    (/(dr\.|doctor|psiholog|terapeut|specialist|phd|psihoterapeut)/i.test(authorName) ? authorName : '')
  const authorOk = Boolean(authorName && credentials)
  factors.push({
    key: 'authorCredibility',
    label: 'Author Credibility',
    score: authorOk ? 6 : authorName ? 3 : 0,
    maxScore: 6,
    passed: authorOk,
    details: authorName ? `${authorName}${credentials ? `, ${credentials}` : ''}` : 'Lipseste autorul',
  })
  if (!authorOk) {
    suggestions.push('Adauga autor + credentiale. Pentru nisa oneirica, expertiza perceputa schimba masiv citabilitatea.')
  }

  const symbolMentions = blocks.dreamSymbols.length
  const hasStudyRefs = /(studiu|cercetare|sursa|conform|research|journal)/i.test(stripHtml(html))
  const dataOk = post.postType === 'DREAM_INTERPRETATION'
    ? symbolMentions >= 2 || hasStudyRefs || blocks.prosCons.length > 0
    : hasStudyRefs || Boolean(post.shortDefinition && wordCount(post.shortDefinition) >= 15)
  factors.push({
    key: 'dataAndStatistics',
    label: 'Data & Supporting Detail',
    score: dataOk ? 6 : symbolMentions >= 1 ? 3 : 0,
    maxScore: 6,
    passed: dataOk,
    details: `simboluri mentionate: ${symbolMentions}`,
  })
  if (!dataOk) {
    suggestions.push('Adauga detalii suport: simboluri mentionate, contexte concrete sau formule de tip "conform surselor".')
  }

  const textWordCount = wordCount(html)
  const sentences = sentenceCount(html)
  const avgSentenceWords = sentences > 0 ? Math.round((textWordCount / sentences) * 10) / 10 : textWordCount
  const citationReady = avgSentenceWords < 20 && snippetCandidates.length >= 2
  factors.push({
    key: 'citationReady',
    label: 'Citation Ready',
    score: citationReady ? 6 : avgSentenceWords < 24 ? 3 : 0,
    maxScore: 6,
    passed: citationReady,
    details: `medie ${avgSentenceWords} cuvinte/propozitie`,
  })
  if (!citationReady) {
    suggestions.push('Scurteaza propozitiile si separa ideile cheie in afirmatii clare, usor de citat.')
  }

  if (!blocks.quickAnswers.length && post.postType === 'DREAM_INTERPRETATION') {
    warnings.push('Lipseste QuickAnswerBlock, desi interpretarea de vis beneficiaza cel mai mult de answer-first snippets.')
  }
  if (!blocks.prosCons.length && /(confuz|ambiguu|depinde)/i.test(stripHtml(html))) {
    warnings.push('Textul sugereaza sensuri multiple, dar lipseste un bloc de contrast semantic.')
  }
  if (!blocks.whenToWorry.length && /(anxietate|teama|cosmar|frica|panic)/i.test(stripHtml(html))) {
    warnings.push('Exista vocabular anxios, dar lipseste un WhenToWorryBlock pentru delimitare responsabila.')
  }
  if (!blocks.expertTakes.length && post.postType !== 'SYMBOL') {
    warnings.push('Un ExpertTakeBlock ar creste increderea si utilitatea pentru AI Overviews.')
  }

  const score = factors.reduce((acc, item) => acc + item.score, 0)
  const aiCitability: GeoResult['aiCitability'] =
    score >= 85 ? 'Foarte Ridicat' : score >= 65 ? 'Ridicat' : score >= 40 ? 'Mediu' : 'Scazut'
  const citationReadiness: GeoResult['citationReadiness'] =
    score >= 80 && citationReady ? 'Foarte Ridicata' : citationReady ? 'Ridicata' : score >= 50 ? 'Medie' : 'Scazuta'

  const answerSignals = [summaryPresent, answerFirstIntro, snippetQuality, definitionClarity].filter(Boolean).length
  const answerQualityLevel: GeoResult['answerQualityLevel'] =
    answerSignals >= 4 ? 'Excelenta' : answerSignals === 3 ? 'Puternica' : answerSignals === 2 ? 'Buna' : 'Slaba'

  return {
    score,
    breakdown: factors,
    suggestions,
    warnings,
    directAnswer: directAnswerWordCount <= 80 ? directAnswer : null,
    speakableSections,
    snippetCandidates,
    llmSummary,
    citationReadiness,
    answerQualityLevel,
    aiCitability,
  }
}


