type CheckStatus = 'PASS' | 'WARN' | 'FAIL'

type CheckResult = {
  site: string
  check: string
  status: CheckStatus
  details: string
}

type RequestContext = {
  siteUrl: URL
  requestBase: URL
  timeoutMs: number
}

function parseTargets() {
  const raw = (process.env.PRELAUNCH_TARGETS || 'https://pagani.ro,https://numarangelic.ro')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  return raw.map((value) => {
    try {
      return new URL(value)
    } catch {
      throw new Error(`Invalid PRELAUNCH_TARGETS URL: ${value}`)
    }
  })
}

function getRequestBase() {
  const raw = process.env.PRELAUNCH_REQUEST_BASE
  if (!raw) return null
  try {
    return new URL(raw)
  } catch {
    throw new Error(`Invalid PRELAUNCH_REQUEST_BASE URL: ${raw}`)
  }
}

function withTimeout(timeoutMs: number) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  return {
    signal: controller.signal,
    done: () => clearTimeout(id),
  }
}

async function fetchForSite(
  ctx: RequestContext,
  pathname: string,
  init?: RequestInit,
) {
  const url = new URL(pathname, ctx.requestBase)
  const timeout = withTimeout(ctx.timeoutMs)
  const headers = new Headers(init?.headers || {})

  // When validating a local/staging origin, force host routing to the target domain.
  if (ctx.requestBase.host !== ctx.siteUrl.host) {
    headers.set('host', ctx.siteUrl.host)
    headers.set('x-forwarded-host', ctx.siteUrl.host)
    headers.set('x-forwarded-proto', ctx.siteUrl.protocol.replace(':', ''))
  }

  try {
    return await fetch(url, {
      ...init,
      headers,
      signal: timeout.signal,
      redirect: init?.redirect || 'manual',
    })
  } finally {
    timeout.done()
  }
}

function pickFirstArticleUrlFromSitemap(xml: string, siteUrl: URL) {
  const matches = Array.from(xml.matchAll(/<loc>(.*?)<\/loc>/g)).map((match) => match[1])
  return (
    matches.find((value) => {
      if (!value.startsWith(siteUrl.origin)) return false
      const path = value.replace(siteUrl.origin, '')
      if (!path || path === '/' || path.startsWith('/admin') || path.startsWith('/api')) return false
      if (path.startsWith('/dictionar')) return false
      return path.split('/').filter(Boolean).length >= 2
    }) || null
  )
}

function pickFirstSymbolUrlFromSitemap(xml: string, siteUrl: URL) {
  const matches = Array.from(xml.matchAll(/<loc>(.*?)<\/loc>/g)).map((match) => match[1])
  return (
    matches.find((value) => {
      if (!value.startsWith(siteUrl.origin)) return false
      const path = value.replace(siteUrl.origin, '')
      return /^\/dictionar\/[A-Z]\/[^/]+$/.test(path)
    }) || null
  )
}

async function validateSite(siteUrl: URL, requestBaseOverride: URL | null): Promise<CheckResult[]> {
  const results: CheckResult[] = []
  const requestBase = requestBaseOverride || siteUrl
  const timeoutMs = Number(process.env.PRELAUNCH_TIMEOUT_MS || 12000)
  const ctx: RequestContext = { siteUrl, requestBase, timeoutMs }

  const push = (check: string, status: CheckStatus, details: string) => {
    results.push({ site: siteUrl.origin, check, status, details })
  }

  let dictionaryPath = '/dictionar'
  let sitemapXml = ''

  try {
    const siteRes = await fetchForSite(ctx, '/api/sites/current')
    if (siteRes.ok) {
      const json = (await siteRes.json()) as { site?: { dictionaryPath?: string | null } }
      if (json?.site?.dictionaryPath) dictionaryPath = json.site.dictionaryPath
      push('site-resolver', 'PASS', `Resolved dictionaryPath=${dictionaryPath}`)
    } else {
      push('site-resolver', 'WARN', `Could not read /api/sites/current (${siteRes.status})`)
    }
  } catch (error) {
    push('site-resolver', 'WARN', `Could not read /api/sites/current (${String(error)})`)
  }

  try {
    const home = await fetchForSite(ctx, '/')
    const html = await home.text()
    if (home.status !== 200) {
      push('route-home', 'FAIL', `Expected 200, got ${home.status}`)
    } else if (!/<title>/i.test(html)) {
      push('route-home', 'WARN', 'Homepage missing <title>')
    } else {
      push('route-home', 'PASS', 'Homepage returns 200 with title')
    }
  } catch (error) {
    push('route-home', 'FAIL', `Request failed: ${String(error)}`)
  }

  try {
    const dict = await fetchForSite(ctx, dictionaryPath)
    if (dict.status === 200) {
      push('route-dictionary', 'PASS', `${dictionaryPath} returns 200`)
    } else {
      push('route-dictionary', 'FAIL', `Expected 200 on ${dictionaryPath}, got ${dict.status}`)
    }
  } catch (error) {
    push('route-dictionary', 'FAIL', `Request failed: ${String(error)}`)
  }

  try {
    const adminRes = await fetchForSite(ctx, '/admin/dashboard', { redirect: 'manual' })
    const location = adminRes.headers.get('location') || ''
    if ([301, 302, 303, 307, 308].includes(adminRes.status) && /\/login\b/.test(location)) {
      push('auth-admin-guard', 'PASS', `Unauth redirect works (${adminRes.status} -> ${location})`)
    } else {
      push('auth-admin-guard', 'FAIL', `Expected redirect to /login, got status=${adminRes.status}, location=${location || '-'}`)
    }
  } catch (error) {
    push('auth-admin-guard', 'FAIL', `Request failed: ${String(error)}`)
  }

  try {
    const robots = await fetchForSite(ctx, '/robots.txt')
    const text = await robots.text()
    if (robots.status !== 200) {
      push('seo-robots', 'FAIL', `Expected 200, got ${robots.status}`)
    } else if (!/Sitemap:/i.test(text)) {
      push('seo-robots', 'WARN', 'robots.txt does not contain Sitemap')
    } else {
      push('seo-robots', 'PASS', 'robots.txt includes Sitemap')
    }
  } catch (error) {
    push('seo-robots', 'FAIL', `Request failed: ${String(error)}`)
  }

  try {
    const sitemap = await fetchForSite(ctx, '/sitemap.xml')
    sitemapXml = await sitemap.text()
    if (sitemap.status !== 200) {
      push('seo-sitemap', 'FAIL', `Expected 200, got ${sitemap.status}`)
    } else if (!/<urlset|<sitemapindex/i.test(sitemapXml)) {
      push('seo-sitemap', 'FAIL', 'sitemap.xml is not valid XML sitemap')
    } else {
      push('seo-sitemap', 'PASS', 'sitemap.xml looks valid')
    }
  } catch (error) {
    push('seo-sitemap', 'FAIL', `Request failed: ${String(error)}`)
  }

  try {
    const feed = await fetchForSite(ctx, '/feed.xml')
    const feedText = await feed.text()
    if (feed.status !== 200) {
      push('seo-rss', 'WARN', `feed.xml returned ${feed.status}`)
    } else if (!/<rss/i.test(feedText)) {
      push('seo-rss', 'WARN', 'feed.xml does not look like RSS 2.0')
    } else {
      push('seo-rss', 'PASS', 'feed.xml returns RSS')
    }
  } catch (error) {
    push('seo-rss', 'WARN', `Request failed: ${String(error)}`)
  }

  if (sitemapXml) {
    const articleUrl = pickFirstArticleUrlFromSitemap(sitemapXml, siteUrl)
    if (!articleUrl) {
      push('seo-article-sample', 'WARN', 'No article URL found in sitemap')
    } else {
      try {
        const articlePath = articleUrl.replace(siteUrl.origin, '')
        const articleRes = await fetchForSite(ctx, articlePath)
        const articleHtml = await articleRes.text()
        if (articleRes.status !== 200) {
          push('seo-article-sample', 'FAIL', `Sample article ${articlePath} returned ${articleRes.status}`)
        } else {
          const hasCanonical = /<link[^>]+rel=["']canonical["']/i.test(articleHtml)
          const hasJsonLd = /<script[^>]+type=["']application\/ld\+json["']/i.test(articleHtml)
          const hasH1 = /<h1[^>]*>[\s\S]*?<\/h1>/i.test(articleHtml)
          if (hasCanonical && hasJsonLd && hasH1) {
            push('seo-article-sample', 'PASS', `Article ${articlePath} has canonical + JSON-LD + H1`)
          } else {
            push(
              'seo-article-sample',
              'WARN',
              `Article ${articlePath} missing: ${[
                hasCanonical ? null : 'canonical',
                hasJsonLd ? null : 'jsonld',
                hasH1 ? null : 'h1',
              ].filter(Boolean).join(', ')}`,
            )
          }
        }
      } catch (error) {
        push('seo-article-sample', 'FAIL', `Request failed: ${String(error)}`)
      }
    }

    const symbolUrl = pickFirstSymbolUrlFromSitemap(sitemapXml, siteUrl)
    if (!symbolUrl) {
      push('seo-symbol-sample', 'WARN', 'No symbol URL found in sitemap')
    } else {
      try {
        const symbolPath = symbolUrl.replace(siteUrl.origin, '')
        const symbolRes = await fetchForSite(ctx, symbolPath)
        const symbolHtml = await symbolRes.text()
        if (symbolRes.status !== 200) {
          push('seo-symbol-sample', 'FAIL', `Sample symbol ${symbolPath} returned ${symbolRes.status}`)
        } else {
          const hasBreadcrumbHint = /Dictionar|Dic?ionar/i.test(symbolHtml)
          const hasH1 = /<h1[^>]*>[\s\S]*?<\/h1>/i.test(symbolHtml)
          if (hasBreadcrumbHint && hasH1) {
            push('seo-symbol-sample', 'PASS', `Symbol ${symbolPath} has breadcrumb context + H1`)
          } else {
            push(
              'seo-symbol-sample',
              'WARN',
              `Symbol ${symbolPath} missing: ${[
                hasBreadcrumbHint ? null : 'breadcrumb-text',
                hasH1 ? null : 'h1',
              ].filter(Boolean).join(', ')}`,
            )
          }
        }
      } catch (error) {
        push('seo-symbol-sample', 'FAIL', `Request failed: ${String(error)}`)
      }
    }
  }

  try {
    const health = await fetchForSite(ctx, '/api/health')
    if (health.ok) {
      push('ops-health-endpoint', 'PASS', `/api/health status=${health.status}`)
    } else {
      push('ops-health-endpoint', 'WARN', `/api/health status=${health.status}`)
    }
  } catch (error) {
    push('ops-health-endpoint', 'WARN', `Request failed: ${String(error)}`)
  }

  return results
}

function printManualChecklist() {
  const items = [
    'Search Console: verifica proprietatile pentru ambele domenii si trimite sitemap.xml',
    'Analytics/Ads: confirma ca scripturile sunt active doar in productie',
    'Affiliate: confirma linkurile de tracking si disclosure pe template-uri',
    'Backup: ruleaza un backup manual si testeaza un restore pe staging',
    'Security: confirma CMS_PUBLISHER_TOKEN, NEXTAUTH_SECRET, BREVO_API_KEY setate in productie',
    'Performance: ruleaza Lighthouse pe homepage + articol + simbol pentru ambele domenii',
  ]

  console.log('\nManual checklist (must-do before launch):')
  for (const item of items) {
    console.log(`- ${item}`)
  }
}

async function main() {
  const targets = parseTargets()
  const requestBaseOverride = getRequestBase()
  const allResults: CheckResult[] = []

  for (const siteUrl of targets) {
    const siteResults = await validateSite(siteUrl, requestBaseOverride)
    allResults.push(...siteResults)
  }

  console.table(
    allResults.map((item) => ({
      site: item.site,
      check: item.check,
      status: item.status,
      details: item.details,
    })),
  )

  const fails = allResults.filter((item) => item.status === 'FAIL')
  const warns = allResults.filter((item) => item.status === 'WARN')
  const passes = allResults.filter((item) => item.status === 'PASS')

  console.log(`\nSummary: PASS=${passes.length} WARN=${warns.length} FAIL=${fails.length}`)
  printManualChecklist()

  if (fails.length > 0) process.exit(1)
}

main().catch((error) => {
  console.error('Prelaunch check crashed:', error)
  process.exit(1)
})

