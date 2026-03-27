import { OpportunityStatus, Prisma, TopicIntent, TopicPriority, TopicStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { countInternalLinks, hasFaqBlock, wordCountFromHtml } from '@/lib/seo/content-audit'
import { generateSlug } from '@/lib/utils'

type HubBlueprint = {
  slug: string
  name: string
  intent: TopicIntent
  priority: TopicPriority
  status: TopicStatus
  monetizationPotential: number
  geoPotential: number
  difficulty: number
  description: string
  pillarTitle: string
  pillarMetaTitle: string
  pillarMetaDescription: string
  supportAngles: string[]
  keywords: string[]
  faq: string[]
}

type BriefPayload = {
  title: string
  metaTitle: string
  metaDescription: string
  outline: Array<{ heading: string; goal: string }>
  faq: Array<{ question: string; answer: string }>
  internalLinks: Array<{ label: string; url: string; type: string }>
  geoBlocks: string[]
  monetizationNotes: string[]
}

const PRIORITY_SCORE: Record<TopicPriority, number> = {
  LOW: 8,
  MEDIUM: 16,
  HIGH: 28,
  CRITICAL: 40,
}

const STATUS_QUEUE: OpportunityStatus[] = [
  OpportunityStatus.READY_TO_WRITE,
  OpportunityStatus.IN_PROGRESS,
  OpportunityStatus.PUBLISHED,
  OpportunityStatus.REFRESH_NEEDED,
]

export const DEFAULT_TOPIC_BLUEPRINTS: HubBlueprint[] = [
  {
    slug: 'animale',
    name: 'Animale in vise',
    intent: TopicIntent.INFORMATIONAL,
    priority: TopicPriority.HIGH,
    status: TopicStatus.ACTIVE,
    monetizationPotential: 68,
    geoPotential: 90,
    difficulty: 44,
    description: 'Hub editorial pentru simbolurile animale, cu subiecte recurente, comportamente si contexte emotionale.',
    pillarTitle: 'Animale in vise: ghid complet de interpretare',
    pillarMetaTitle: 'Animale in vise - ghid complet de interpretare | Cand Visam',
    pillarMetaDescription: 'Hub editorial despre animale in vise: semnificatii, contexte, FAQ, interpretari rapide si legaturi spre simbolurile relevante.',
    supportAngles: ['simbolul dominant', 'context pozitiv vs negativ', 'psihologic vs spiritual', 'cand apare repetitiv'],
    keywords: ['animale in vise', 'ce inseamna animale in vis', 'interpretare vise animale', 'simbol animale'],
    faq: ['Ce inseamna animalele in vise?', 'Cand devine important un vis cu animale?', 'Cum difera animalele domestice de cele salbatice?', 'Ce simboluri se repeta cel mai des?', 'Cum leg visul de starea mea emotionala?'],
  },
  {
    slug: 'familie',
    name: 'Familie in vise',
    intent: TopicIntent.INFORMATIONAL,
    priority: TopicPriority.HIGH,
    status: TopicStatus.ACTIVE,
    monetizationPotential: 58,
    geoPotential: 84,
    difficulty: 38,
    description: 'Hub pentru vise despre parinti, copii, parteneri si dinamici de familie.',
    pillarTitle: 'Familie in vise: semnificatii si contexte emotionale',
    pillarMetaTitle: 'Familie in vise - semnificatii si interpretari | Cand Visam',
    pillarMetaDescription: 'Descopera ce inseamna visele despre familie, relatii apropiate, conflicte, impacare si mesaje emotionale recurente.',
    supportAngles: ['parinti', 'copii', 'parteneri', 'conflicte si reconciliere'],
    keywords: ['familie in vise', 'ce inseamna sa visezi familia', 'parinti in vis', 'copil in vis'],
    faq: ['Ce inseamna cand visezi familia?', 'De ce apar conflicte familiale in vis?', 'Cum interpretez visele cu parinti?', 'Ce inseamna copilul in vis?', 'Cand indica visul o nevoie emotionala reala?'],
  },
  {
    slug: 'moarte',
    name: 'Moarte in vise',
    intent: TopicIntent.INFORMATIONAL,
    priority: TopicPriority.CRITICAL,
    status: TopicStatus.ACTIVE,
    monetizationPotential: 54,
    geoPotential: 95,
    difficulty: 52,
    description: 'Hub sensibil despre moarte in vise, schimbare, incheiere de etape si anxietati.',
    pillarTitle: 'Moarte in vise: schimbare, frica si interpretare corecta',
    pillarMetaTitle: 'Moarte in vise - interpretare corecta si sensuri posibile | Cand Visam',
    pillarMetaDescription: 'Ghid clar despre ce inseamna moartea in vise, cand semnaleaza schimbare, frica sau incheiere si cum sa citesti contextul corect.',
    supportAngles: ['schimbare si renuntare', 'frica si anxietate', 'moartea altcuiva', 'cand sa iei visul in serios'],
    keywords: ['moarte in vis', 'ce inseamna cand visezi moarte', 'vis cu moartea', 'interpretare moarte in vise'],
    faq: ['Ce inseamna moartea in vis?', 'Este un semn rau?', 'Ce inseamna cand visezi moartea cuiva apropiat?', 'Cand vorbeste visul despre anxietate?', 'Exista o semnificatie spirituala?'],
  },
  {
    slug: 'sarcina',
    name: 'Sarcina in vise',
    intent: TopicIntent.INFORMATIONAL,
    priority: TopicPriority.HIGH,
    status: TopicStatus.ACTIVE,
    monetizationPotential: 72,
    geoPotential: 88,
    difficulty: 43,
    description: 'Hub despre sarcina in vise, inceputuri, proiecte, vulnerabilitate si crestere personala.',
    pillarTitle: 'Sarcina in vise: inceputuri, emotii si transformare',
    pillarMetaTitle: 'Sarcina in vise - ce semnifica si cum se interpreteaza | Cand Visam',
    pillarMetaDescription: 'Intelege ce inseamna sarcina in vise, cum se leaga de inceputuri, frici, creativitate si nevoi emotionale actuale.',
    supportAngles: ['inceputuri noi', 'anxietate si responsabilitate', 'feminitate si creativitate', 'context personal'],
    keywords: ['sarcina in vis', 'ce inseamna cand visezi ca esti insarcinata', 'graviditate in vis', 'interpretare sarcina in vise'],
    faq: ['Ce inseamna sarcina in vis?', 'Are legatura cu un copil real?', 'Cand vorbeste despre un proiect nou?', 'Ce inseamna daca visul provoaca frica?', 'Cum se schimba interpretarea in functie de context?'],
  },
  {
    slug: 'vise-recurente',
    name: 'Vise recurente',
    intent: TopicIntent.INFORMATIONAL,
    priority: TopicPriority.CRITICAL,
    status: TopicStatus.ACTIVE,
    monetizationPotential: 65,
    geoPotential: 94,
    difficulty: 36,
    description: 'Hub despre vise repetate, patternuri emotionale, triggeri si interpretare sistematica.',
    pillarTitle: 'Vise recurente: de ce se repeta si cum le interpretezi',
    pillarMetaTitle: 'Vise recurente - de ce se repeta si ce inseamna | Cand Visam',
    pillarMetaDescription: 'Afla de ce apar vise recurente, cum identifici patternurile si ce inseamna repetitia unui simbol sau scenariu oniric.',
    supportAngles: ['pattern emotional', 'simbol recurent', 'stres si triggeri', 'cand ai nevoie de context suplimentar'],
    keywords: ['vise recurente', 'vis care se repeta', 'de ce se repeta visele', 'interpretare vise recurente'],
    faq: ['De ce se repeta acelasi vis?', 'Ce inseamna un simbol recurent?', 'Cand apare stresul in visele recurente?', 'Cum opresc un vis repetitiv?', 'Cand merita sa notez visele?'],
  },
  {
    slug: 'spiritual',
    name: 'Vise spirituale',
    intent: TopicIntent.INVESTIGATIONAL,
    priority: TopicPriority.MEDIUM,
    status: TopicStatus.ACTIVE,
    monetizationPotential: 50,
    geoPotential: 82,
    difficulty: 49,
    description: 'Hub despre dimensiunea spirituala a viselor, simboluri, intuitie si sens interior.',
    pillarTitle: 'Vise spirituale: simboluri, intuitie si sens interior',
    pillarMetaTitle: 'Vise spirituale - simboluri si interpretare | Cand Visam',
    pillarMetaDescription: 'Exploreaza latura spirituala a viselor: simboluri, semnale interioare, intuitie si diferente fata de o lectura psihologica.',
    supportAngles: ['simboluri spirituale', 'semne si intuitie', 'contrast psihologic vs spiritual', 'cum ramai ancorat in realitate'],
    keywords: ['vise spirituale', 'ce inseamna spiritual in vise', 'simboluri spirituale', 'interpretare spirituala vise'],
    faq: ['Ce este un vis spiritual?', 'Cum deosebesc intuitia de anxietate?', 'Ce simboluri apar des in vise spirituale?', 'Cand ajuta o interpretare psihologica?', 'Cum pastrez echilibrul in interpretare?'],
  },
  {
    slug: 'apa',
    name: 'Apa in vise',
    intent: TopicIntent.INFORMATIONAL,
    priority: TopicPriority.HIGH,
    status: TopicStatus.ACTIVE,
    monetizationPotential: 60,
    geoPotential: 89,
    difficulty: 35,
    description: 'Hub despre apa, emotii, curgere, inundatii, mare, ploaie si limpezime.',
    pillarTitle: 'Apa in vise: emotii, curgere si semnale importante',
    pillarMetaTitle: 'Apa in vise - ce inseamna si cum interpretezi contextul | Cand Visam',
    pillarMetaDescription: 'Ghid complet pentru visele cu apa: emotii, calm, haos, inundatie, mare, ploaie si sensul contextului in interpretare.',
    supportAngles: ['apa limpede vs tulbure', 'mare, rau, ploaie', 'inundatie si emotii intense', 'simbol al schimbarii'],
    keywords: ['apa in vis', 'ce inseamna apa in vise', 'vis cu apa', 'interpretare apa in vis'],
    faq: ['Ce inseamna apa in vis?', 'Cum schimba sensul starea apei?', 'Ce inseamna inundatia?', 'Apa e legata de emotii?', 'Cum interpretez marea sau raul?'],
  },
  {
    slug: 'serpi',
    name: 'Serpi in vise',
    intent: TopicIntent.INFORMATIONAL,
    priority: TopicPriority.CRITICAL,
    status: TopicStatus.ACTIVE,
    monetizationPotential: 74,
    geoPotential: 96,
    difficulty: 41,
    description: 'Hub pentru unul dintre cele mai cautate simboluri: serpi, frica, transformare si avertisment.',
    pillarTitle: 'Serpi in vise: frica, transformare si avertisment',
    pillarMetaTitle: 'Serpi in vise - sensuri, frica si interpretare | Cand Visam',
    pillarMetaDescription: 'Tot ce trebuie sa stii despre serpi in vise: frica, schimbare, avertisment, simbol spiritual si context emotional.',
    supportAngles: ['serpi multi', 'muscatura', 'frica vs putere', 'semnificatie psihologica si spirituala'],
    keywords: ['serpi in vise', 'ce inseamna cand visezi serpi', 'sarpe in vis', 'interpretare serpi'],
    faq: ['Ce inseamna serpii in vise?', 'Este un semn negativ?', 'Ce inseamna muscatura de sarpe?', 'Cand simbolul vorbeste despre transformare?', 'Ce spune contextul emotional al visului?'],
  },
]

function safeJson<T>(value: T): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

function computeOpportunityScore(opportunity: {
  monetizationPotential: number
  geoPotential: number
  difficulty: number
  priority: TopicPriority
  status: OpportunityStatus
}) {
  const freshnessBonus = opportunity.status === OpportunityStatus.READY_TO_WRITE
    ? 12
    : opportunity.status === OpportunityStatus.REFRESH_NEEDED
      ? 8
      : opportunity.status === OpportunityStatus.IN_PROGRESS
        ? 4
        : 0

  return Math.round(
    opportunity.monetizationPotential * 0.35 +
      opportunity.geoPotential * 0.35 +
      (100 - opportunity.difficulty) * 0.18 +
      PRIORITY_SCORE[opportunity.priority] +
      freshnessBonus,
  )
}

function buildFaq(questions: string[]) {
  return questions.map((question) => ({
    question,
    answer: 'Raspunsul final trebuie scris clar, in 2-3 propozitii, cu context direct si fara ambiguitate.',
  }))
}

function buildOutline(blueprint: HubBlueprint, targetName: string) {
  return [
    { heading: 'Raspuns rapid', goal: `Ofera un raspuns direct pentru intentia principala legata de ${targetName}.` },
    { heading: 'Ce inseamna in general', goal: `Explica sensul central al subiectului ${targetName} in context oniric.` },
    { heading: 'Interpretare psihologica', goal: 'Leaga simbolul sau tema de emotii, stres, patternuri si context personal.' },
    { heading: 'Interpretare spirituala', goal: 'Adauga doar ce este relevant si diferentiaza clar de lectura psihologica.' },
    { heading: 'Context pozitiv vs negativ', goal: blueprint.supportAngles.join(', ') },
    { heading: 'Intrebari frecvente', goal: 'Raspunde scurt si concret la intrebarile recurente ale cititorilor.' },
  ]
}

function buildHubJsonFromOutline(title: string, outline: Array<{ heading: string; goal: string }>) {
  return {
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: `Acest hub editorial despre ${title.toLowerCase()} organizeaza simbolurile, intrebarile frecvente si interpretarile esentiale pentru cititorii care cauta raspunsuri rapide si context solid.` }] },
      ...outline.flatMap((item) => ([
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: item.heading }] },
        { type: 'paragraph', content: [{ type: 'text', text: item.goal }] },
      ])),
    ],
  }
}

function buildHubHtml(title: string, outline: Array<{ heading: string; goal: string }>, supportAngles: string[], faq: Array<{ question: string; answer: string }>) {
  const sections = outline
    .map((item) => `<section><h2>${item.heading}</h2><p>${item.goal}</p></section>`)
    .join('')
  const supportList = supportAngles.map((angle) => `<li>${angle}</li>`).join('')
  const faqHtml = faq.map((item) => `<div><h3>${item.question}</h3><p>${item.answer}</p></div>`).join('')

  return `<p>Acest hub editorial despre ${title.toLowerCase()} aduna cele mai utile interpretari, simboluri asociate si intrebari frecvente pentru cititorii care vor raspunsuri clare.</p><section><h2>Ce vei gasi in acest hub</h2><ul>${supportList}</ul></section>${sections}<section><h2>FAQ esential</h2>${faqHtml}</section>`
}

function buildMonetizationNotes(type: string, targetName: string) {
  return [
    `Testeaza newsletter CTA contextual pentru ${targetName}.`,
    type === 'MISSING_HUB'
      ? 'Hub-ul poate sustine ads in zonele de overview si poate distribui trafic spre paginile suport.'
      : 'Pagina poate primi monetizare usoara: CTA newsletter, produse recomandate sau ads moderate dupa ce depaseste pragul de trafic.',
    'Pastreaza distinctia intre continut editorial si orice plasament comercial.',
  ]
}

async function getInternalLinkCandidates(args: {
  siteId: string
  clusterId?: string | null
  categoryId?: string | null
  symbolId?: string | null
  currentPostId?: string | null
}) {
  const postOr: Prisma.PostWhereInput[] = []
  if (args.clusterId) postOr.push({ topicClusterId: args.clusterId })
  if (args.categoryId) postOr.push({ categoryId: args.categoryId })

  const [posts, symbols] = await Promise.all([
    prisma.post.findMany({
      where: {
        siteId: args.siteId,
        status: 'PUBLISHED',
        NOT: args.currentPostId ? { id: args.currentPostId } : undefined,
        ...(postOr.length ? { OR: postOr } : {}),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        sourceType: true,
        category: { select: { slug: true, name: true } },
      },
      take: 4,
      orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
    }),
    prisma.symbolEntry.findMany({
      where: args.symbolId
        ? { siteId: args.siteId, NOT: { id: args.symbolId }, publishedAt: { not: null } }
        : { siteId: args.siteId, publishedAt: { not: null } },
      select: { id: true, name: true, slug: true, letter: true },
      take: 3,
      orderBy: { updatedAt: 'desc' },
    }),
  ])

  return [
    ...posts.map((post) => ({
      label: post.title,
      url: post.category?.slug ? `/${post.category.slug}/${post.slug}` : `/${post.slug}`,
      type: post.sourceType === 'HUB' ? 'hub' : 'post',
    })),
    ...symbols.map((symbol) => ({
      label: symbol.name,
      url: `/dictionar/${symbol.letter}/${symbol.slug}`,
      type: 'symbol',
    })),
  ].slice(0, 5)
}

export async function ensureDefaultTopicAuthority(siteId: string, userId?: string | null) {
  const categories = await prisma.category.findMany({ where: { siteId }, select: { id: true, slug: true } })
  const bySlug = new Map(categories.map((category) => [category.slug, category.id]))

  const clusters = []

  for (const blueprint of DEFAULT_TOPIC_BLUEPRINTS) {
    const cluster = await prisma.topicCluster.upsert({
      where: { siteId_slug: { siteId, slug: blueprint.slug } },
      update: {
        name: blueprint.name,
        intent: blueprint.intent,
        priority: blueprint.priority,
        status: blueprint.status,
        monetizationPotential: blueprint.monetizationPotential,
        geoPotential: blueprint.geoPotential,
        difficulty: blueprint.difficulty,
        description: blueprint.description,
        pillarTitle: blueprint.pillarTitle,
        pillarMetaTitle: blueprint.pillarMetaTitle,
        pillarMetaDescription: blueprint.pillarMetaDescription,
        outlineTemplate: safeJson(buildOutline(blueprint, blueprint.name)),
        supportAngles: safeJson(blueprint.supportAngles),
        categoryId: bySlug.get(blueprint.slug) || null,
      },
      create: {
        siteId,
        name: blueprint.name,
        slug: blueprint.slug,
        intent: blueprint.intent,
        priority: blueprint.priority,
        status: blueprint.status,
        monetizationPotential: blueprint.monetizationPotential,
        geoPotential: blueprint.geoPotential,
        difficulty: blueprint.difficulty,
        description: blueprint.description,
        pillarTitle: blueprint.pillarTitle,
        pillarMetaTitle: blueprint.pillarMetaTitle,
        pillarMetaDescription: blueprint.pillarMetaDescription,
        outlineTemplate: safeJson(buildOutline(blueprint, blueprint.name)),
        supportAngles: safeJson(blueprint.supportAngles),
        categoryId: bySlug.get(blueprint.slug) || null,
        createdById: userId || null,
      },
    })

    for (const keyword of blueprint.keywords) {
      await prisma.topicKeyword.upsert({
        where: { clusterId_slug: { clusterId: cluster.id, slug: generateSlug(keyword) } },
        update: {
          name: keyword,
          intent: blueprint.intent,
          priority: blueprint.priority,
          status: TopicStatus.ACTIVE,
          monetizationPotential: blueprint.monetizationPotential,
          geoPotential: blueprint.geoPotential,
          difficulty: blueprint.difficulty,
        },
        create: {
          name: keyword,
          slug: generateSlug(keyword),
          intent: blueprint.intent,
          priority: blueprint.priority,
          status: TopicStatus.ACTIVE,
          monetizationPotential: blueprint.monetizationPotential,
          geoPotential: blueprint.geoPotential,
          difficulty: blueprint.difficulty,
          clusterId: cluster.id,
        },
      })
    }

    clusters.push(cluster)
  }

  return clusters
}

export async function syncTopicAuthority(siteId: string, userId?: string | null) {
  const clusters = await ensureDefaultTopicAuthority(siteId, userId)
  const [publishedPosts, categories, symbols] = await Promise.all([
    prisma.post.findMany({
      where: { siteId, status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        slug: true,
        topicClusterId: true,
        categoryId: true,
        category: { select: { slug: true, name: true } },
        sourceType: true,
        contentHtml: true,
        contentJson: true,
        schemaMarkup: true,
        geoScore: true,
      },
    }),
    prisma.category.findMany({
      where: { siteId },
      select: {
        id: true,
        name: true,
        slug: true,
        posts: { where: { status: 'PUBLISHED' }, select: { id: true } },
      },
    }),
    prisma.symbolEntry.findMany({
      where: { siteId },
      select: {
        id: true,
        name: true,
        slug: true,
        letter: true,
        shortDefinition: true,
        fullContent: true,
        contentJson: true,
        geoScore: true,
        publishedAt: true,
      },
    }),
  ])

  const clusterBySlug = new Map(clusters.map((cluster) => [cluster.slug, cluster]))

  for (const blueprint of DEFAULT_TOPIC_BLUEPRINTS) {
    const cluster = clusterBySlug.get(blueprint.slug)
    if (!cluster) continue

    const hasHub = publishedPosts.some((post) => post.topicClusterId === cluster.id && post.sourceType === 'HUB')
    await prisma.contentOpportunity.upsert({
      where: { siteId_slug: { siteId, slug: `hub-${cluster.slug}` } },
      update: {
        name: `Hub lipsa: ${cluster.name}`,
        intent: blueprint.intent,
        priority: blueprint.priority,
        status: hasHub ? OpportunityStatus.PUBLISHED : OpportunityStatus.READY_TO_WRITE,
        monetizationPotential: blueprint.monetizationPotential,
        geoPotential: blueprint.geoPotential,
        difficulty: blueprint.difficulty,
        opportunityType: 'MISSING_HUB',
        summary: `Hub principal pentru ${cluster.name} ${hasHub ? 'este publicat' : 'lipseste si trebuie creat'}.`,
        recommendedTitle: blueprint.pillarTitle,
        recommendedMeta: blueprint.pillarMetaDescription,
        outline: safeJson(buildOutline(blueprint, cluster.name)),
        faq: safeJson(buildFaq(blueprint.faq)),
        geoBlocks: safeJson(['QuickAnswerBlock', 'ProsConsMeaningBlock', 'ExpertTakeBlock', 'FAQBlock']),
        monetizationNotes: buildMonetizationNotes('MISSING_HUB', cluster.name).join('\n'),
        clusterId: cluster.id,
      },
      create: {
        siteId,
        name: `Hub lipsa: ${cluster.name}`,
        slug: `hub-${cluster.slug}`,
        intent: blueprint.intent,
        priority: blueprint.priority,
        status: hasHub ? OpportunityStatus.PUBLISHED : OpportunityStatus.READY_TO_WRITE,
        monetizationPotential: blueprint.monetizationPotential,
        geoPotential: blueprint.geoPotential,
        difficulty: blueprint.difficulty,
        opportunityType: 'MISSING_HUB',
        summary: `Hub principal pentru ${cluster.name} ${hasHub ? 'este publicat' : 'lipseste si trebuie creat'}.`,
        recommendedTitle: blueprint.pillarTitle,
        recommendedMeta: blueprint.pillarMetaDescription,
        outline: safeJson(buildOutline(blueprint, cluster.name)),
        faq: safeJson(buildFaq(blueprint.faq)),
        geoBlocks: safeJson(['QuickAnswerBlock', 'ProsConsMeaningBlock', 'ExpertTakeBlock', 'FAQBlock']),
        monetizationNotes: buildMonetizationNotes('MISSING_HUB', cluster.name).join('\n'),
        clusterId: cluster.id,
      },
    })
  }

  for (const category of categories.filter((item) => item.posts.length < 3)) {
    await prisma.contentOpportunity.upsert({
      where: { siteId_slug: { siteId, slug: `expand-category-${category.slug}` } },
      update: {
        name: `Extinde categoria ${category.name}`,
        intent: TopicIntent.INFORMATIONAL,
        priority: category.posts.length === 0 ? TopicPriority.CRITICAL : TopicPriority.HIGH,
        status: OpportunityStatus.READY_TO_WRITE,
        monetizationPotential: 46,
        geoPotential: 72,
        difficulty: 35,
        opportunityType: 'UNDERDEVELOPED_CATEGORY',
        summary: `Categoria ${category.name} are doar ${category.posts.length} pagini publicate si are nevoie de cluster support pages.`,
        recommendedTitle: `Ghid esential pentru ${category.name.toLowerCase()} in vise`,
        recommendedMeta: `Construieste suport editorial in categoria ${category.name} cu FAQ, links si raspunsuri directe.`,
        categoryId: category.id,
      },
      create: {
        siteId,
        name: `Extinde categoria ${category.name}`,
        slug: `expand-category-${category.slug}`,
        intent: TopicIntent.INFORMATIONAL,
        priority: category.posts.length === 0 ? TopicPriority.CRITICAL : TopicPriority.HIGH,
        status: OpportunityStatus.READY_TO_WRITE,
        monetizationPotential: 46,
        geoPotential: 72,
        difficulty: 35,
        opportunityType: 'UNDERDEVELOPED_CATEGORY',
        summary: `Categoria ${category.name} are doar ${category.posts.length} pagini publicate si are nevoie de cluster support pages.`,
        recommendedTitle: `Ghid esential pentru ${category.name.toLowerCase()} in vise`,
        recommendedMeta: `Construieste suport editorial in categoria ${category.name} cu FAQ, links si raspunsuri directe.`,
        categoryId: category.id,
      },
    })
  }

  for (const symbol of symbols.filter((item) => (item.geoScore || 0) < 55 || wordCountFromHtml(item.fullContent || '') < 250 || !hasFaqBlock(item.contentJson))) {
    await prisma.contentOpportunity.upsert({
      where: { siteId_slug: { siteId, slug: `refresh-symbol-${symbol.slug}` } },
      update: {
        name: `Refresh simbol ${symbol.name}`,
        intent: TopicIntent.INFORMATIONAL,
        priority: TopicPriority.HIGH,
        status: OpportunityStatus.REFRESH_NEEDED,
        monetizationPotential: 52,
        geoPotential: 82,
        difficulty: 28,
        opportunityType: 'SYMBOL_REFRESH',
        summary: `Simbolul ${symbol.name} are nevoie de continut mai puternic pentru GEO/FAQ sau profunzime editoriala.`,
        recommendedTitle: `${symbol.name} in vis: interpretare completa si context`,
        recommendedMeta: `Imbunatateste pagina simbolului ${symbol.name} cu raspuns direct, FAQ si interpretare structurata.`,
        symbolId: symbol.id,
      },
      create: {
        siteId,
        name: `Refresh simbol ${symbol.name}`,
        slug: `refresh-symbol-${symbol.slug}`,
        intent: TopicIntent.INFORMATIONAL,
        priority: TopicPriority.HIGH,
        status: OpportunityStatus.REFRESH_NEEDED,
        monetizationPotential: 52,
        geoPotential: 82,
        difficulty: 28,
        opportunityType: 'SYMBOL_REFRESH',
        summary: `Simbolul ${symbol.name} are nevoie de continut mai puternic pentru GEO/FAQ sau profunzime editoriala.`,
        recommendedTitle: `${symbol.name} in vis: interpretare completa si context`,
        recommendedMeta: `Imbunatateste pagina simbolului ${symbol.name} cu raspuns direct, FAQ si interpretare structurata.`,
        symbolId: symbol.id,
      },
    })
  }


  return prisma.contentOpportunity.count({ where: { siteId } })
}

export async function generateBriefForOpportunity(siteId: string, opportunityId: string, userId?: string | null) {
  const opportunity = await prisma.contentOpportunity.findFirst({
    where: { id: opportunityId, siteId },
    include: {
      cluster: { include: { keywords: true } },
      category: true,
      symbol: true,
      post: { include: { category: true } },
    },
  })

  if (!opportunity) {
    throw new Error('Opportunity not found')
  }

  const blueprint = DEFAULT_TOPIC_BLUEPRINTS.find((item) => item.slug === opportunity.cluster?.slug)
  const targetName = opportunity.cluster?.name || opportunity.symbol?.name || opportunity.category?.name || opportunity.post?.title || opportunity.name
  const outline = blueprint
    ? buildOutline(blueprint, targetName)
    : buildOutline({
        slug: generateSlug(targetName),
        name: targetName,
        intent: opportunity.intent,
        priority: opportunity.priority,
        status: TopicStatus.ACTIVE,
        monetizationPotential: opportunity.monetizationPotential,
        geoPotential: opportunity.geoPotential,
        difficulty: opportunity.difficulty,
        description: opportunity.summary || '',
        pillarTitle: opportunity.recommendedTitle || targetName,
        pillarMetaTitle: opportunity.recommendedTitle || targetName,
        pillarMetaDescription: opportunity.recommendedMeta || targetName,
        supportAngles: ['semnificatie generala', 'context psihologic', 'context spiritual', 'cand apare repetitiv'],
        keywords: [targetName],
        faq: [`Ce inseamna ${targetName.toLowerCase()} in vise?`, 'Care este interpretarea de baza?', 'Cand conteaza contextul emotional?', 'Cum diferentiez sensul pozitiv de cel negativ?', 'Ce intrebare are cititorul imediat dupa cautare?'],
      }, targetName)

  const faq = buildFaq(blueprint?.faq || [`Ce inseamna ${targetName.toLowerCase()} in vise?`, 'Care este interpretarea rapida?', 'Ce context schimba sensul?', 'Cand merita actualizat continutul?', 'Cum leg pagina de alte resurse?'])
  const internalLinks = await getInternalLinkCandidates({
    siteId,
    clusterId: opportunity.clusterId,
    categoryId: opportunity.categoryId,
    symbolId: opportunity.symbolId,
    currentPostId: opportunity.postId,
  })

  const geoBlocks = [
    'QuickAnswerBlock',
    opportunity.symbolId ? 'ProsConsMeaningBlock' : 'WhenToWorryBlock',
    'ExpertTakeBlock',
    'FAQBlock',
  ]

  const monetizationNotes = buildMonetizationNotes(opportunity.opportunityType || 'EDITORIAL', targetName)
  const title = opportunity.recommendedTitle || `${targetName} in vise: ghid editorial complet`
  const metaDescription = opportunity.recommendedMeta || `Pagina despre ${targetName.toLowerCase()} trebuie sa ofere raspuns direct, FAQ, internal links si structura editoriala clara.`

  const payload: BriefPayload = {
    title,
    metaTitle: title.length > 60 ? `${title.slice(0, 57)}...` : title,
    metaDescription,
    outline,
    faq,
    internalLinks,
    geoBlocks,
    monetizationNotes,
  }

  const brief = await prisma.topicBrief.upsert({
    where: { siteId_slug: { siteId, slug: `${opportunity.slug}-brief` } },
    update: {
      name: `${opportunity.name} brief`,
      intent: opportunity.intent,
      priority: opportunity.priority,
      status: opportunity.status,
      monetizationPotential: opportunity.monetizationPotential,
      geoPotential: opportunity.geoPotential,
      difficulty: opportunity.difficulty,
      title: payload.title,
      metaTitle: payload.metaTitle,
      metaDescription: payload.metaDescription,
      outline: safeJson(payload.outline),
      faq: safeJson(payload.faq),
      internalLinks: safeJson(payload.internalLinks),
      geoBlocks: safeJson(payload.geoBlocks),
      monetizationNotes: payload.monetizationNotes.join('\n'),
      siteId,
      opportunityId: opportunity.id,
      clusterId: opportunity.clusterId,
      postId: opportunity.postId,
      createdById: userId || undefined,
    },
    create: {
      name: `${opportunity.name} brief`,
      slug: `${opportunity.slug}-brief`,
      intent: opportunity.intent,
      priority: opportunity.priority,
      status: opportunity.status,
      monetizationPotential: opportunity.monetizationPotential,
      geoPotential: opportunity.geoPotential,
      difficulty: opportunity.difficulty,
      siteId,
      title: payload.title,
      metaTitle: payload.metaTitle,
      metaDescription: payload.metaDescription,
      outline: safeJson(payload.outline),
      faq: safeJson(payload.faq),
      internalLinks: safeJson(payload.internalLinks),
      geoBlocks: safeJson(payload.geoBlocks),
      monetizationNotes: payload.monetizationNotes.join('\n'),
      opportunityId: opportunity.id,
      clusterId: opportunity.clusterId,
      postId: opportunity.postId,
      createdById: userId || null,
    },
  })

  return { brief, payload }
}

export async function createHubDraftFromCluster(siteId: string, clusterId: string, userId: string) {
  const cluster = await prisma.topicCluster.findFirst({
    where: { id: clusterId, siteId },
    include: {
      category: true,
      keywords: true,
      pillarPost: true,
    },
  })

  if (!cluster) throw new Error('Cluster not found')
  if (cluster.pillarPostId && cluster.pillarPost) return cluster.pillarPost

  const blueprint = DEFAULT_TOPIC_BLUEPRINTS.find((item) => item.slug === cluster.slug)
  const outline = Array.isArray(cluster.outlineTemplate) ? (cluster.outlineTemplate as Array<{ heading: string; goal: string }>) : buildOutline(blueprint || DEFAULT_TOPIC_BLUEPRINTS[0], cluster.name)
  const faq = buildFaq(blueprint?.faq || [`Ce inseamna ${cluster.name.toLowerCase()} in vise?`, 'Care este raspunsul rapid?', 'Ce contexte trebuie tratate?', 'Ce simboluri trebuie legate?', 'Ce intrebari trebuie acoperite?'])
  const title = cluster.pillarTitle || `${cluster.name}: hub editorial complet`
  const slug = generateSlug(title)
  const contentJson = buildHubJsonFromOutline(cluster.name, outline)
  const contentHtml = buildHubHtml(cluster.name, outline, (cluster.supportAngles as string[] | null) || blueprint?.supportAngles || [], faq)
  const post = await prisma.post.create({
    data: {
      siteId,
      title,
      slug,
      excerpt: cluster.description || `Hub editorial pentru ${cluster.name.toLowerCase()} in vise.`,
      contentJson: safeJson(contentJson),
      contentHtml,
      postType: 'ARTICLE',
      status: 'DRAFT',
      metaTitle: cluster.pillarMetaTitle || title,
      metaDescription: cluster.pillarMetaDescription || cluster.description || `Hub editorial pentru ${cluster.name.toLowerCase()} in vise.`,
      focusKeyword: cluster.keywords[0]?.name || cluster.name,
      categoryId: cluster.categoryId,
      authorId: userId,
      sourceType: 'HUB',
      topicClusterId: cluster.id,
      revisions: safeJson([
        {
          version: 1,
          savedAt: new Date().toISOString(),
          userId,
          title,
          contentJson,
          contentHtml,
          metaTitle: cluster.pillarMetaTitle || title,
          metaDescription: cluster.pillarMetaDescription || cluster.description || '',
        },
      ]),
      internalLinksUsed: safeJson([]),
    },
  })

  await prisma.topicCluster.update({
    where: { id: cluster.id },
    data: { pillarPostId: post.id },
  })

  await prisma.contentOpportunity.updateMany({
    where: { clusterId: cluster.id, opportunityType: 'MISSING_HUB' },
    data: { status: OpportunityStatus.IN_PROGRESS, postId: post.id },
  })

  return post
}

export async function getTopicAuthorityReport(siteId: string) {
  const [clusters, opportunities, posts, symbols, categories] = await Promise.all([
    prisma.topicCluster.findMany({
      where: { siteId },
      include: {
        keywords: true,
        opportunities: true,
        posts: { select: { id: true, status: true, sourceType: true, title: true, slug: true, category: { select: { slug: true, name: true } } } },
        pillarPost: { select: { id: true, title: true, slug: true, category: { select: { slug: true } } } },
      },
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
    }),
    prisma.contentOpportunity.findMany({
      where: { siteId },
      include: {
        cluster: { select: { name: true, slug: true } },
        category: { select: { name: true, slug: true } },
        symbol: { select: { name: true, slug: true, letter: true } },
        post: { select: { title: true, slug: true, category: { select: { slug: true } } } },
      },
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
    }),
    prisma.post.findMany({
      where: { siteId, status: 'PUBLISHED' },
      select: {
        id: true,
        title: true,
        slug: true,
        sourceType: true,
        topicClusterId: true,
        category: { select: { slug: true, name: true } },
        contentHtml: true,
        contentJson: true,
        schemaMarkup: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.symbolEntry.findMany({
      where: { siteId },
      select: {
        id: true,
        name: true,
        slug: true,
        letter: true,
        geoScore: true,
        fullContent: true,
        contentJson: true,
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.category.findMany({
      where: { siteId },
      select: {
        id: true,
        name: true,
        slug: true,
        posts: { where: { status: 'PUBLISHED' }, select: { id: true } },
      },
    }),
  ])

  const clusterCoverage = clusters.map((cluster) => {
    const publishedSupport = cluster.posts.filter((post) => post.status === 'PUBLISHED')
    const score = Math.min(100, Math.round(
      (cluster.pillarPost ? 35 : 0) +
      Math.min(30, publishedSupport.length * 10) +
      Math.min(20, cluster.keywords.length * 3) +
      Math.min(15, cluster.opportunities.filter((item) => item.status === OpportunityStatus.PUBLISHED).length * 5),
    ))

    return {
      id: cluster.id,
      name: cluster.name,
      slug: cluster.slug,
      priority: cluster.priority,
      coverageScore: score,
      keywordCount: cluster.keywords.length,
      opportunityCount: cluster.opportunities.length,
      publishedSupportCount: publishedSupport.length,
      hasHub: Boolean(cluster.pillarPost),
      hubUrl: cluster.pillarPost?.category?.slug ? `/${cluster.pillarPost.category.slug}/${cluster.pillarPost.slug}` : null,
    }
  })

  const orphanContent = posts
    .filter((post) => !post.topicClusterId && post.sourceType !== 'HUB')
    .map((post) => ({
      id: post.id,
      title: post.title,
      url: post.category?.slug ? `/${post.category.slug}/${post.slug}` : `/${post.slug}`,
      updatedAt: post.updatedAt,
    }))
    .slice(0, 12)

  const missingSupportPages = [
    ...DEFAULT_TOPIC_BLUEPRINTS.filter((blueprint) => !clusters.some((cluster) => cluster.slug === blueprint.slug)).map((blueprint) => ({
      type: 'missing-cluster',
      label: `Lipseste clusterul ${blueprint.name}`,
    })),
    ...clusters.filter((cluster) => !cluster.pillarPost).map((cluster) => ({
      type: 'missing-hub',
      label: `Clusterul ${cluster.name} nu are hub publicat`,
    })),
    ...categories.filter((category) => category.posts.length < 3).map((category) => ({
      type: 'thin-category',
      label: `Categoria ${category.name} are doar ${category.posts.length} pagini publicate`,
    })),
  ].slice(0, 12)

  const topOpportunities = opportunities
    .filter((item) => item.status !== OpportunityStatus.DISMISSED)
    .map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      status: item.status,
      type: item.opportunityType,
      score: computeOpportunityScore(item),
      cluster: item.cluster?.name || null,
      category: item.category?.name || null,
      targetUrl: item.post?.category?.slug ? `/${item.post.category.slug}/${item.post.slug}` : item.symbol ? `/dictionar/${item.symbol.letter}/${item.symbol.slug}` : null,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12)

  const pagesMissingSupport = posts
    .filter((post) => countInternalLinks(post.contentHtml || '') < 2 || !hasFaqBlock(post.contentJson) || !post.schemaMarkup)
    .map((post) => ({
      id: post.id,
      title: post.title,
      url: post.category?.slug ? `/${post.category.slug}/${post.slug}` : `/${post.slug}`,
      linkCount: countInternalLinks(post.contentHtml || ''),
      hasFaq: hasFaqBlock(post.contentJson),
      hasSchema: Boolean(post.schemaMarkup),
    }))
    .slice(0, 12)

  const weakSymbols = symbols
    .filter((symbol) => (symbol.geoScore || 0) < 55 || wordCountFromHtml(symbol.fullContent || '') < 250 || !hasFaqBlock(symbol.contentJson))
    .map((symbol) => ({
      id: symbol.id,
      name: symbol.name,
      url: `/dictionar/${symbol.letter}/${symbol.slug}`,
      geoScore: symbol.geoScore || 0,
    }))
    .slice(0, 10)

  const queue = STATUS_QUEUE.map((status) => ({
    status,
    count: opportunities.filter((item) => item.status === status).length,
  }))

  return {
    summary: {
      clusters: clusters.length,
      opportunities: opportunities.length,
      orphanContent: orphanContent.length,
      missingSupportPages: missingSupportPages.length,
    },
    queue,
    clusterCoverage,
    orphanContent,
    missingSupportPages,
    topOpportunities,
    gaps: {
      weakSymbols,
      underdevelopedCategories: categories.filter((category) => category.posts.length < 3).map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        publishedCount: category.posts.length,
      })),
      pagesMissingSupport,
    },
  }
}
