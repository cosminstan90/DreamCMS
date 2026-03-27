/* eslint-disable @typescript-eslint/no-explicit-any */
import { mergeAttributes, Node } from '@tiptap/core'

type PayloadRenderer = (payload: Record<string, any>, attrs: Record<string, any>) => [string, ...any[]]

function createDataNode(name: string, label: string, renderPayload: PayloadRenderer) {
  return Node.create({
    name,
    group: 'block',
    atom: true,

    addAttributes() {
      return {
        payload: {
          default: {},
        },
      }
    },

    parseHTML() {
      return [{ tag: `div[data-node="${name}"]` }]
    },

    renderHTML({ HTMLAttributes }) {
      const payload = (HTMLAttributes.payload || {}) as Record<string, any>
      return renderPayload(payload, HTMLAttributes) as [string, ...any[]]
    },
  })
}

export const DreamInterpretationBlock = createDataNode('dreamInterpretationBlock', 'Interpretare Vis', (payload, attrs) => {
  const children: any[] = [
    ['h2', { class: 'dreamcms-block-heading' }, payload.dreamTitle || 'Interpretare vis'],
  ]

  if (payload.generalMeaning) {
    children.push(['section', { class: 'dreamcms-block-section' }, ['h3', { 'data-speakable-title': 'Interpretare generala' }, 'Interpretare generala'], ['p', {}, payload.generalMeaning]])
  }
  if (payload.psychologicalMeaning) {
    children.push(['section', { class: 'dreamcms-block-section' }, ['h3', { 'data-speakable-title': 'Semnificatie psihologica' }, 'Semnificatie psihologica'], ['p', {}, payload.psychologicalMeaning]])
  }
  if (payload.spiritualMeaning) {
    children.push(['section', { class: 'dreamcms-block-section' }, ['h3', { 'data-speakable-title': 'Semnificatie spirituala' }, 'Semnificatie spirituala'], ['p', {}, payload.spiritualMeaning]])
  }
  if (payload.warningNote) {
    children.push(['aside', { class: 'dreamcms-callout dreamcms-callout-warning' }, payload.warningNote])
  }

  return ['div', mergeAttributes(attrs, { 'data-node': 'dreamInterpretationBlock', class: 'dreamcms-block dreamcms-dream-interpretation' }), ...children]
})

export const SymbolCardBlock = createDataNode('symbolCardBlock', 'Symbol Card', (payload, attrs) => {
  const contexts = Array.isArray(payload.contexts) ? payload.contexts : []
  return ['div', mergeAttributes(attrs, { 'data-node': 'symbolCardBlock', class: 'dreamcms-block dreamcms-symbol-card' }),
    ['div', { class: 'dreamcms-symbol-header' },
      ['div', { class: 'dreamcms-symbol-emoji' }, payload.symbolEmoji || 'Simbol'],
      ['div', {},
        ['h3', { 'data-speakable-title': payload.symbolName || 'Simbol' }, payload.symbolName || 'Simbol'],
        ['p', {}, payload.shortMeaning || '']
      ]
    ],
    ...contexts.map((context: Record<string, any>) => ['section', { class: 'dreamcms-block-section' }, ['h4', {}, context.context || 'Context'], ['p', {}, context.meaning || '']])
  ]
})

export const FAQBlock = createDataNode('faqBlock', 'FAQ', (payload, attrs) => {
  const items = Array.isArray(payload.items) ? payload.items : []
  return ['div', mergeAttributes(attrs, { 'data-node': 'faqBlock', class: 'dreamcms-block dreamcms-faq' }),
    ['h2', { 'data-speakable-title': 'Intrebari frecvente' }, 'Intrebari frecvente'],
    ...items.map((item: Record<string, any>) => ['div', { class: 'dreamcms-block-section' }, ['h3', {}, item.question || 'Intrebare'], ['p', {}, item.answer || '']])
  ]
})

export const DreamSymbolsListBlock = createDataNode('dreamSymbolsListBlock', 'Lista Simboluri', (payload, attrs) => {
  const items = Array.isArray(payload.items) ? payload.items : []
  return ['div', mergeAttributes(attrs, { 'data-node': 'dreamSymbolsListBlock', class: 'dreamcms-block dreamcms-symbol-list' }),
    ['h2', { 'data-speakable-title': 'Simboluri in acest vis' }, 'Simboluri in acest vis'],
    ['ul', { class: 'dreamcms-symbol-grid' },
      ...items.map((item: Record<string, any>) => ['li', { class: 'dreamcms-symbol-grid-item' }, ['strong', {}, item.symbolName || item.slug || 'Simbol'], item.shortMeaning ? ['p', {}, item.shortMeaning] : ['span', {}, '']])
    ]
  ]
})

export const CalloutBlock = createDataNode('calloutBlock', 'Callout', (payload, attrs) => {
  const kind = String(payload.kind || 'info')
  return ['aside', mergeAttributes(attrs, { 'data-node': 'calloutBlock', class: `dreamcms-callout dreamcms-callout-${kind}` }), payload.text || '']
})


export const ImageGalleryBlock = createDataNode('imageGalleryBlock', 'Image Gallery', (payload, attrs) => {
  const items = Array.isArray(payload.items) ? payload.items : []
  return [
    'div',
    mergeAttributes(attrs, { 'data-node': 'imageGalleryBlock', class: 'dreamcms-block dreamcms-image-gallery' }),
    ['h2', { 'data-speakable-title': 'Galerie imagini' }, payload.title || 'Galerie imagini'],
    ['div', { class: 'dreamcms-image-gallery-grid' },
      ...items.map((item: Record<string, any>) => [
        'figure',
        { class: 'dreamcms-image-gallery-item' },
        ['img', { src: item.src || '', alt: item.alt || '', width: item.width || 800, height: item.height || 600, loading: 'lazy' }],
        item.caption ? ['figcaption', {}, item.caption] : ['span', {}],
      ]),
    ],
  ]
})
export const QuickAnswerBlock = createDataNode('quickAnswerBlock', 'Quick Answer', (payload, attrs) => {
  return ['div', mergeAttributes(attrs, { 'data-node': 'quickAnswerBlock', class: 'dreamcms-block dreamcms-quick-answer' }),
    ['h2', { 'data-speakable-title': 'Raspuns rapid' }, payload.question || 'Raspuns rapid'],
    ['p', { class: 'dreamcms-quick-answer-text' }, payload.answer || ''],
    payload.supportingDetail ? ['p', { class: 'dreamcms-quick-answer-support' }, payload.supportingDetail] : ['span', {}]
  ]
})

export const ProsConsMeaningBlock = createDataNode('prosConsMeaningBlock', 'Pros & Cons Meaning', (payload, attrs) => {
  return ['div', mergeAttributes(attrs, { 'data-node': 'prosConsMeaningBlock', class: 'dreamcms-block dreamcms-pros-cons' }),
    ['h2', { 'data-speakable-title': 'Cand e pozitiv vs negativ' }, 'Cand e pozitiv vs negativ'],
    ['div', { class: 'dreamcms-pros-cons-grid' },
      ['section', { class: 'dreamcms-pros' }, ['h3', {}, 'Cand are sens pozitiv'], ['p', {}, payload.positiveMeaning || '']],
      ['section', { class: 'dreamcms-cons' }, ['h3', {}, 'Cand cere prudenta'], ['p', {}, payload.cautionMeaning || '']]
    ],
    payload.contextsSummary ? ['p', { class: 'dreamcms-block-footnote' }, payload.contextsSummary] : ['span', {}]
  ]
})

export const WhenToWorryBlock = createDataNode('whenToWorryBlock', 'When To Worry', (payload, attrs) => {
  const signs = Array.isArray(payload.signs) ? payload.signs : []
  return ['aside', mergeAttributes(attrs, { 'data-node': 'whenToWorryBlock', class: 'dreamcms-block dreamcms-when-to-worry' }),
    ['h2', { 'data-speakable-title': 'Cand sa te ingrijorezi' }, 'Cand sa te ingrijorezi'],
    signs.length
      ? ['ul', {}, ...signs.map((sign: string) => ['li', {}, sign])]
      : ['p', {}, 'Nu exista semnale adaugate inca.'],
    payload.reassurance ? ['p', { class: 'dreamcms-block-footnote' }, payload.reassurance] : ['span', {}]
  ]
})

export const ExpertTakeBlock = createDataNode('expertTakeBlock', 'Expert Take', (payload, attrs) => {
  const expertLabel = [payload.expertName, payload.expertRole].filter(Boolean).join(', ')
  return ['figure', mergeAttributes(attrs, { 'data-node': 'expertTakeBlock', class: 'dreamcms-block dreamcms-expert-take' }),
    ['h2', { 'data-speakable-title': 'Perspectiva de expert' }, 'Perspectiva de expert'],
    ['blockquote', {}, payload.take || ''],
    expertLabel ? ['figcaption', {}, expertLabel] : ['span', {}],
    payload.confidence ? ['p', { class: 'dreamcms-block-footnote' }, `Nivel de incredere: ${payload.confidence}`] : ['span', {}]
  ]
})

export function buildDreamSchemaPayload(dreamTitle: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    about: { '@type': 'Thing', name: dreamTitle },
  }
}

export function buildDefinedTermSchema(symbolName: string, shortMeaning: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: symbolName,
    description: shortMeaning,
  }
}

export function buildFAQSchema(items: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: entry.answer,
      },
    })),
  }
}

export function buildItemListSchema(items: Array<{ symbolName: string; slug: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `/dictionar/${item.slug}`,
      name: item.symbolName,
    })),
  }
}



