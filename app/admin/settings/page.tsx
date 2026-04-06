'use client'

import { useEffect, useMemo, useState } from 'react'
import type { SiteHomepageSection } from '@/lib/sites/types'

type SeoSettingsDto = {
  siteName: string
  siteUrl: string
  defaultMetaTitle: string | null
  defaultMetaDesc: string | null
  defaultOgImage: string | null
  robotsTxt: string | null
  googleVerification: string | null
  blockAiBots: boolean
}

type PingAttempt = {
  attempt: number
  ok: boolean
  status: number | null
  error: string | null
}

type PublisherItem = {
  id: string
  title: string
  publisherCampaign: string | null
  updatedAt: string
}

type SiteSettingsDto = {
  id: string
  name: string
  slug: string
  templatePack: string
  themeKey: string
  homepageSections: SiteHomepageSection[]
}

const AI_BOTS = ['GPTBot', 'CCBot', 'anthropic-ai', 'Claude-Web']
const AI_FLAG = '# block-ai:true'
const SECTION_LABELS: Record<SiteHomepageSection['key'], string> = {
  hero: 'Hero',
  latestPosts: 'Latest Posts',
  categories: 'Categories',
  featuredSymbols: 'Featured Symbols',
  newsletter: 'Newsletter',
}

function stripAiFlag(text: string) {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim().toLowerCase() !== AI_FLAG)
    .join('\n')
}

function buildEffectiveRobots(siteUrl: string, robotsTxt: string, blockAiBots: boolean) {
  const clean = stripAiFlag(robotsTxt || '').trim()
  const lines = clean
    ? clean
    : `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: ${siteUrl.replace(/\/$/, '')}/sitemap.xml`

  if (!blockAiBots) return lines

  const botLines = AI_BOTS.map((bot) => `User-agent: ${bot}\nDisallow: /`).join('\n\n')
  return `${lines}\n\n${botLines}`
}

function validateRobots(content: string) {
  const warnings: string[] = []
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)

  if (!lines.some((line) => /^user-agent\s*:/i.test(line))) {
    warnings.push('Lipseste cel putin o regula User-agent.')
  }

  for (const line of lines) {
    if (/^(user-agent|allow|disallow|sitemap)\b/i.test(line) && !line.includes(':')) {
      warnings.push(`Linie invalida (fara :): ${line}`)
    }

    if (/^disallow\s*:/i.test(line)) {
      const value = line.split(':').slice(1).join(':').trim()
      if (value && !value.startsWith('/')) {
        warnings.push(`Disallow ar trebui sa inceapa cu /. Linie: ${line}`)
      }
    }
  }

  return warnings
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const targetIndex = index + direction
  if (targetIndex < 0 || targetIndex >= items.length) return items
  const clone = [...items]
  const [item] = clone.splice(index, 1)
  clone.splice(targetIndex, 0, item)
  return clone
}

export default function AdminSeoSettingsPage() {
  const [tab, setTab] = useState<'seo' | 'homepage' | 'sitemap' | 'publisher'>('seo')
  const [settings, setSettings] = useState<SeoSettingsDto | null>(null)
  const [siteSettings, setSiteSettings] = useState<SiteSettingsDto | null>(null)
  const [saving, setSaving] = useState(false)
  const [savingHomepage, setSavingHomepage] = useState(false)
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string | null>(null)
  const [urlCount, setUrlCount] = useState(0)
  const [working, setWorking] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [lastAttempts, setLastAttempts] = useState<PingAttempt[]>([])

  const [publisherTokenMasked, setPublisherTokenMasked] = useState('')
  const [publisherTokenValue, setPublisherTokenValue] = useState('')
  const [publisherStatus, setPublisherStatus] = useState<string | null>(null)
  const [publisherItems, setPublisherItems] = useState<PublisherItem[]>([])

  async function loadSettings() {
    const res = await fetch('/api/seo-settings')
    const json = await res.json()
    setSettings(json)
  }

  async function loadSiteSettings() {
    const res = await fetch('/api/sites/current')
    const json = await res.json()
    setSiteSettings(json.site)
  }

  async function loadSitemapStats() {
    const res = await fetch('/api/seo-settings/sitemap')
    const json = await res.json()
    setLastGeneratedAt(json.lastGeneratedAt || null)
    setUrlCount(json.urlCount || 0)
  }

  async function loadPublisher() {
    const [tokenRes, recentRes] = await Promise.all([
      fetch('/api/publisher/token'),
      fetch('/api/publisher/recent'),
    ])
    const tokenJson = await tokenRes.json()
    const recentJson = await recentRes.json()
    setPublisherTokenMasked(tokenJson.tokenMasked || '')
    setPublisherItems(Array.isArray(recentJson.data) ? recentJson.data : [])
  }

  useEffect(() => {
    loadSettings()
    loadSiteSettings()
    loadSitemapStats()
    loadPublisher()
  }, [])

  const effectiveRobots = useMemo(() => {
    if (!settings) return ''
    return buildEffectiveRobots(settings.siteUrl || 'https://pagani.ro', settings.robotsTxt || '', settings.blockAiBots)
  }, [settings])

  const robotsWarnings = useMemo(() => validateRobots(effectiveRobots), [effectiveRobots])

  async function save() {
    if (!settings) return
    setSaving(true)
    setStatusMessage(null)
    try {
      await fetch('/api/seo-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      await loadSettings()
      setStatusMessage('Setarile SEO au fost salvate.')
    } finally {
      setSaving(false)
    }
  }

  async function saveHomepage() {
    if (!siteSettings) return
    setSavingHomepage(true)
    setStatusMessage(null)
    try {
      await fetch('/api/sites/current', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ homepageSections: siteSettings.homepageSections }),
      })
      await loadSiteSettings()
      setStatusMessage('Structura homepage-ului a fost salvata.')
    } finally {
      setSavingHomepage(false)
    }
  }

  async function runSitemapAction(action: 'regenerate' | 'ping-google' | 'ping-bing') {
    setWorking(action)
    setStatusMessage(null)
    setLastAttempts([])
    try {
      const res = await fetch('/api/seo-settings/sitemap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await res.json()
      setStatusMessage(json.message || (res.ok ? 'Actiune executata.' : 'Actiune esuata.'))
      if (Array.isArray(json.attempts)) setLastAttempts(json.attempts)
      if (action === 'regenerate') {
        setLastGeneratedAt(json.lastGeneratedAt || null)
        setUrlCount(json.urlCount || 0)
      }
    } finally {
      setWorking(null)
    }
  }

  async function regenerateToken() {
    setPublisherStatus(null)
    const res = await fetch('/api/publisher/token', { method: 'POST' })
    const json = await res.json()
    if (json.token) {
      setPublisherTokenValue(json.token)
      setPublisherTokenMasked(`${json.token.slice(0, 4)}...${json.token.slice(-4)}`)
      setPublisherStatus('Token regenerat. Copiaza-l si actualizeaza sursa externa.')
    }
  }

  async function testConnection() {
    setPublisherStatus(null)
    const token = publisherTokenValue || ''
    if (!token) {
      setPublisherStatus('Introdu token-ul pentru test sau regenereaza-l.')
      return
    }
    const res = await fetch('/api/publisher/test', {
      method: 'POST',
      headers: { 'X-CMS-Token': token },
    })
    const json = await res.json()
    setPublisherStatus(json.ok ? 'Conexiune OK.' : 'Test esuat.')
  }

  if (!settings || !siteSettings) return <div className="text-slate-300">Se incarca setarile...</div>

  const siteUrl = (settings.siteUrl || 'https://pagani.ro').replace(/\/$/, '')

  return (
    <section className="space-y-6">
      <div className="flex w-fit gap-2 rounded-xl border border-slate-700 bg-[#1e293b] p-2">
        <button
          type="button"
          onClick={() => setTab('seo')}
          className={`rounded-lg px-4 py-2 text-sm ${tab === 'seo' ? 'bg-[#8b5cf6] text-white' : 'bg-[#0f172a] text-slate-300'}`}
        >
          SEO
        </button>
        <button
          type="button"
          onClick={() => setTab('homepage')}
          className={`rounded-lg px-4 py-2 text-sm ${tab === 'homepage' ? 'bg-[#8b5cf6] text-white' : 'bg-[#0f172a] text-slate-300'}`}
        >
          Homepage
        </button>
        <button
          type="button"
          onClick={() => setTab('sitemap')}
          className={`rounded-lg px-4 py-2 text-sm ${tab === 'sitemap' ? 'bg-[#8b5cf6] text-white' : 'bg-[#0f172a] text-slate-300'}`}
        >
          Sitemap
        </button>
        <button
          type="button"
          onClick={() => setTab('publisher')}
          className={`rounded-lg px-4 py-2 text-sm ${tab === 'publisher' ? 'bg-[#8b5cf6] text-white' : 'bg-[#0f172a] text-slate-300'}`}
        >
          Publisher
        </button>
      </div>

      {tab === 'seo' && (
        <div className="max-w-3xl space-y-4 rounded-xl border border-slate-700 bg-[#1e293b] p-6">
          <h1 className="text-xl font-semibold text-white">Setari SEO</h1>

          <input
            value={settings.siteName || ''}
            onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
            placeholder="Site name"
            className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2"
          />
          <input
            value={settings.siteUrl || ''}
            onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
            placeholder="Site URL"
            className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2"
          />
          <input
            value={settings.defaultMetaTitle || ''}
            onChange={(e) => setSettings({ ...settings, defaultMetaTitle: e.target.value })}
            placeholder="Default meta title"
            className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2"
          />
          <textarea
            value={settings.defaultMetaDesc || ''}
            onChange={(e) => setSettings({ ...settings, defaultMetaDesc: e.target.value })}
            placeholder="Default meta description"
            rows={3}
            className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2"
          />

          <button onClick={save} className="rounded-lg bg-[#8b5cf6] px-4 py-2 text-white">
            {saving ? 'Se salveaza...' : 'Salveaza setari'}
          </button>
        </div>
      )}

      {tab === 'homepage' && (
        <div className="max-w-5xl space-y-4 rounded-xl border border-slate-700 bg-[#1e293b] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-white">Homepage Sections</h1>
              <p className="mt-2 text-sm text-slate-300">
                Configurezi structura homepage-ului pentru site-ul curent, fara sa atingi codul. Ordinea de mai jos este ordinea randarii in frontend.
              </p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2 text-xs text-slate-300">
              {siteSettings.name} • {siteSettings.templatePack}
            </div>
          </div>

          <div className="space-y-3">
            {siteSettings.homepageSections.map((section, index) => (
              <div key={`${section.key}-${index}`} className="space-y-3 rounded-xl border border-slate-700 bg-[#0f172a] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-white">{SECTION_LABELS[section.key]}</div>
                    <div className="text-xs text-slate-400">Cheie: {section.key}</div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-2 text-sm text-slate-200">
                      <input
                        type="checkbox"
                        checked={section.enabled}
                        onChange={(e) => {
                          const next = [...siteSettings.homepageSections]
                          next[index] = { ...section, enabled: e.target.checked }
                          setSiteSettings({ ...siteSettings, homepageSections: next })
                        }}
                      />
                      Activ
                    </label>
                    <button
                      type="button"
                      onClick={() => setSiteSettings({ ...siteSettings, homepageSections: moveItem(siteSettings.homepageSections, index, -1) })}
                      className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200 disabled:opacity-40"
                      disabled={index === 0}
                    >
                      Sus
                    </button>
                    <button
                      type="button"
                      onClick={() => setSiteSettings({ ...siteSettings, homepageSections: moveItem(siteSettings.homepageSections, index, 1) })}
                      className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200 disabled:opacity-40"
                      disabled={index === siteSettings.homepageSections.length - 1}
                    >
                      Jos
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    value={section.title || ''}
                    onChange={(e) => {
                      const next = [...siteSettings.homepageSections]
                      next[index] = { ...section, title: e.target.value }
                      setSiteSettings({ ...siteSettings, homepageSections: next })
                    }}
                    placeholder="Titlu sectiune"
                    className="w-full rounded-lg border border-slate-700 bg-[#111827] px-3 py-2"
                  />
                  <input
                    value={typeof section.limit === 'number' ? String(section.limit) : ''}
                    onChange={(e) => {
                      const raw = e.target.value.trim()
                      const nextLimit = raw ? Number(raw) : undefined
                      const next = [...siteSettings.homepageSections]
                      next[index] = {
                        ...section,
                        limit: typeof nextLimit === 'number' && Number.isFinite(nextLimit) ? Math.max(1, Math.min(24, nextLimit)) : undefined,
                      }
                      setSiteSettings({ ...siteSettings, homepageSections: next })
                    }}
                    placeholder="Limit (optional)"
                    className="w-full rounded-lg border border-slate-700 bg-[#111827] px-3 py-2"
                  />
                </div>

                <textarea
                  value={section.subtitle || ''}
                  onChange={(e) => {
                    const next = [...siteSettings.homepageSections]
                    next[index] = { ...section, subtitle: e.target.value }
                    setSiteSettings({ ...siteSettings, homepageSections: next })
                  }}
                  rows={2}
                  placeholder="Subtitlu / descriere sectiune"
                  className="w-full rounded-lg border border-slate-700 bg-[#111827] px-3 py-2"
                />
              </div>
            ))}
          </div>

          <button onClick={saveHomepage} className="rounded-lg bg-[#8b5cf6] px-4 py-2 text-white">
            {savingHomepage ? 'Se salveaza...' : 'Salveaza homepage'}
          </button>
        </div>
      )}

      {tab === 'sitemap' && (
        <div className="max-w-4xl space-y-4 rounded-xl border border-slate-700 bg-[#1e293b] p-6">
          <h1 className="text-xl font-semibold text-white">Sitemap</h1>
          <p className="text-sm text-slate-300">Last generated: {lastGeneratedAt ? new Date(lastGeneratedAt).toLocaleString('ro-RO') : 'N/A'}</p>
          <p className="text-sm text-slate-300">Count URL-uri: {urlCount}</p>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => runSitemapAction('regenerate')}
              className="rounded-lg bg-[#8b5cf6] px-4 py-2 text-white"
            >
              {working === 'regenerate' ? 'Regeneram...' : 'Regenereaza'}
            </button>
            <button
              onClick={() => window.open('/sitemap.xml', '_blank')}
              className="rounded-lg bg-slate-700 px-4 py-2 text-slate-100"
            >
              Preview Sitemap
            </button>
            <a
              href="https://search.google.com/search-console"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-slate-700 px-4 py-2 text-slate-100"
            >
              Search Console →
            </a>
            <button
              onClick={() => runSitemapAction('ping-bing')}
              className="rounded-lg bg-slate-700 px-4 py-2 text-slate-100"
            >
              {working === 'ping-bing' ? 'Ping...' : 'Ping Bing'}
            </button>
          </div>

          {statusMessage && <p className={`text-sm ${statusMessage.includes('inchis') ? 'text-amber-400' : 'text-slate-200'}`}>{statusMessage}</p>}

          {lastAttempts.length > 0 && (
            <div className="space-y-1 rounded-lg border border-slate-700 bg-[#0f172a] p-3 text-xs text-slate-300">
              {lastAttempts.map((attempt) => (
                <div key={attempt.attempt}>
                  Incercarea {attempt.attempt}: {attempt.ok ? `OK (${attempt.status})` : `Eroare${attempt.status ? ` (${attempt.status})` : ''}${attempt.error ? ` - ${attempt.error}` : ''}`}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3 border-t border-slate-700 pt-2">
            <h2 className="text-lg font-semibold text-white">Robots.txt (Live)</h2>

            <textarea
              value={settings.robotsTxt || ''}
              onChange={(e) => setSettings({ ...settings, robotsTxt: e.target.value })}
              placeholder="User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\nSitemap: https://pagani.ro/sitemap.xml"
              rows={8}
              className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2 font-mono text-sm"
            />

            <label className="flex items-center gap-2 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={settings.blockAiBots}
                onChange={(e) => setSettings({ ...settings, blockAiBots: e.target.checked })}
              />
              Blocheaza AI bots (GPTBot, CCBot, anthropic-ai, Claude-Web)
            </label>

            <button onClick={save} className="rounded-lg bg-[#8b5cf6] px-4 py-2 text-white">
              {saving ? 'Se salveaza...' : 'Salveaza robots'}
            </button>

            {robotsWarnings.length > 0 && (
              <div className="space-y-1 rounded-lg border border-amber-700 bg-amber-950/40 p-3 text-sm text-amber-200">
                {robotsWarnings.map((warning) => (
                  <div key={warning}>- {warning}</div>
                ))}
              </div>
            )}

            <div className="rounded-lg border border-slate-700 bg-[#0f172a] p-3">
              <div className="mb-2 text-sm text-slate-300">Preview efectiv</div>
              <pre className="whitespace-pre-wrap font-mono text-xs text-slate-200">{effectiveRobots}</pre>
            </div>
          </div>
        </div>
      )}

      {tab === 'publisher' && (
        <div className="max-w-4xl space-y-4 rounded-xl border border-slate-700 bg-[#1e293b] p-6">
          <h1 className="text-xl font-semibold text-white">Publisher</h1>
          <div className="text-sm text-slate-300">Endpoint: {siteUrl}/api/publisher/receive</div>

          <div className="space-y-2 rounded-lg border border-slate-700 bg-[#0f172a] p-4">
            <div className="text-sm text-slate-300">Token curent (mascat): {publisherTokenMasked || 'N/A'}</div>
            <div className="flex flex-wrap gap-2">
              <button className="rounded bg-slate-700 px-3 py-2 text-slate-100" onClick={regenerateToken}>
                Regenereaza token
              </button>
              <button
                className="rounded bg-slate-700 px-3 py-2 text-slate-100"
                onClick={() => publisherTokenValue && navigator.clipboard.writeText(publisherTokenValue)}
              >
                Copy token
              </button>
            </div>

            <input
              value={publisherTokenValue}
              onChange={(e) => setPublisherTokenValue(e.target.value)}
              placeholder="Token pentru test"
              className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2"
            />

            <button className="rounded bg-[#8b5cf6] px-3 py-2 text-white" onClick={testConnection}>
              Test connection
            </button>

            {publisherStatus && <div className="text-sm text-slate-200">{publisherStatus}</div>}
          </div>

          <div className="rounded-lg border border-slate-700 bg-[#0f172a] p-4">
            <div className="mb-2 text-sm text-slate-300">Ultimele 10 postari primite</div>
            <div className="space-y-2 text-sm text-slate-200">
              {publisherItems.length === 0 && <div>Niciun post primit.</div>}
              {publisherItems.map((item) => (
                <div key={item.id} className="flex justify-between gap-2">
                  <div>{item.title}</div>
                  <div className="text-slate-400">{item.publisherCampaign || '-'} | {new Date(item.updatedAt).toLocaleDateString('ro-RO')}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {statusMessage && tab !== 'sitemap' && <p className="text-sm text-slate-200">{statusMessage}</p>}
    </section>
  )
}

