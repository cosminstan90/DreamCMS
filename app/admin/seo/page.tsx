/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useMemo, useState } from 'react'
import { MediaPicker } from '@/components/media/MediaPicker'
import { AdsConfig, defaultAdsConfig } from '@/lib/ads/config'

type SeoSettingsDto = {
  siteName: string
  siteUrl: string
  defaultMetaTitle: string | null
  defaultMetaDesc: string | null
  defaultOgImage: string | null
  robotsTxt: string | null
  googleVerification: string | null
  blockAiBots: boolean
  enableAutoInternalLinks: boolean
  adsConfig: AdsConfig
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

type LinkReportRow = {
  id: string
  title: string
  slug: string
  status: string
  updatedAt: string
  url: string
  linkCount: number
  category?: { slug: string; name: string } | null
}

type LinkReport = {
  summary: {
    totalPosts: number
    noInternalLinks: number
    underTwoInternalLinks: number
    wellLinked: number
  }
  noInternalLinks: LinkReportRow[]
  underTwoInternalLinks: LinkReportRow[]
  topPagesByInternalLinks: LinkReportRow[]
}

const AI_BOTS = ['GPTBot', 'CCBot', 'anthropic-ai', 'Claude-Web']
const AI_FLAG = '# block-ai:true'

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

export default function AdminSeoPage() {
  const [tab, setTab] = useState<'general' | 'robots' | 'sitemap' | 'publisher' | 'ads' | 'links'>('general')
  const [settings, setSettings] = useState<SeoSettingsDto | null>(null)
  const [saving, setSaving] = useState(false)
  const [lastGeneratedAt, setLastGeneratedAt] = useState<string | null>(null)
  const [urlCount, setUrlCount] = useState(0)
  const [working, setWorking] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [lastAttempts, setLastAttempts] = useState<PingAttempt[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [linkReport, setLinkReport] = useState<LinkReport | null>(null)
  const [linksLoading, setLinksLoading] = useState(false)

  const [publisherTokenMasked, setPublisherTokenMasked] = useState('')
  const [publisherTokenValue, setPublisherTokenValue] = useState('')
  const [publisherStatus, setPublisherStatus] = useState<string | null>(null)
  const [publisherItems, setPublisherItems] = useState<PublisherItem[]>([])

  async function loadSettings() {
    const res = await fetch('/api/seo-settings')
    const json = await res.json()
    setSettings({ ...json, adsConfig: json.adsConfig || defaultAdsConfig, enableAutoInternalLinks: Boolean(json.enableAutoInternalLinks) })
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

  async function loadLinkReport() {
    setLinksLoading(true)
    try {
      const res = await fetch('/api/internal-links/report')
      const json = await res.json()
      setLinkReport(json)
    } finally {
      setLinksLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
    loadSitemapStats()
    loadPublisher()
    loadLinkReport()
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

  if (!settings) return <div className="text-slate-300">Se incarca setarile...</div>
  const siteUrl = (settings.siteUrl || 'https://pagani.ro').replace(/\/$/, '')

  return (
    <section className="space-y-6">
      <div className="w-fit rounded-xl border border-slate-700 bg-[#1e293b] p-2">
        <div className="flex flex-wrap gap-2">
          {(['general', 'robots', 'sitemap', 'publisher', 'ads', 'links'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-lg px-4 py-2 text-sm ${tab === key ? 'bg-[#8b5cf6] text-white' : 'bg-[#0f172a] text-slate-300'}`}
            >
              {key.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {tab === 'general' && (
        <div className="max-w-3xl space-y-4 rounded-xl border border-slate-700 bg-[#1e293b] p-6">
          <h1 className="text-xl font-semibold text-white">General</h1>
          <input value={settings.siteName || ''} onChange={(e) => setSettings({ ...settings, siteName: e.target.value })} placeholder="Site name" className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2" />
          <input value={settings.siteUrl || ''} onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })} placeholder="Site URL" className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2" />
          <input value={settings.defaultMetaTitle || ''} onChange={(e) => setSettings({ ...settings, defaultMetaTitle: e.target.value })} placeholder="Default meta title" className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2" />
          <textarea value={settings.defaultMetaDesc || ''} onChange={(e) => setSettings({ ...settings, defaultMetaDesc: e.target.value })} placeholder="Default meta description" rows={3} className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2" />
          <div className="space-y-2">
            <div className="text-sm text-slate-300">Default OG image</div>
            {settings.defaultOgImage && <img src={settings.defaultOgImage} alt="og" className="w-full max-w-xs rounded" />}
            <button className="rounded bg-slate-700 px-3 py-2 text-slate-100" onClick={() => setPickerOpen(true)}>Alege imagine</button>
          </div>
          <input value={settings.googleVerification || ''} onChange={(e) => setSettings({ ...settings, googleVerification: e.target.value })} placeholder="Google verification" className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2" />
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input type="checkbox" checked={settings.enableAutoInternalLinks} onChange={(e) => setSettings({ ...settings, enableAutoInternalLinks: e.target.checked })} />
            Activeaza auto-link safe mode la save (max 2 linkuri contextuale)
          </label>
          <div className="rounded-lg border border-slate-700 bg-[#0f172a] p-3 text-sm text-slate-300">
            Safe mode evita headings, blocuri FAQ/callout si paragrafe care au deja linkuri.
          </div>
          <button onClick={save} className="rounded-lg bg-[#8b5cf6] px-4 py-2 text-white">{saving ? 'Se salveaza...' : 'Salveaza setari'}</button>
        </div>
      )}

      {tab === 'ads' && (
        <div className="max-w-5xl space-y-4 rounded-xl border border-slate-700 bg-[#1e293b] p-6">
          <h1 className="text-xl font-semibold text-white">Ads</h1>
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input type="checkbox" checked={settings.adsConfig.enabled} onChange={(e) => setSettings({ ...settings, adsConfig: { ...settings.adsConfig, enabled: e.target.checked } })} />
            Activeaza ads pe frontend
          </label>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <select value={settings.adsConfig.provider} onChange={(e) => setSettings({ ...settings, adsConfig: { ...settings.adsConfig, provider: e.target.value as AdsConfig['provider'] } })} className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2">
              <option value="adsense">AdSense</option>
              <option value="custom">Custom</option>
            </select>
            <input value={settings.adsConfig.publisherId} onChange={(e) => setSettings({ ...settings, adsConfig: { ...settings.adsConfig, publisherId: e.target.value } })} placeholder="Publisher ID" className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2" />
            <input value={settings.adsConfig.scriptUrl} onChange={(e) => setSettings({ ...settings, adsConfig: { ...settings.adsConfig, scriptUrl: e.target.value } })} placeholder="Script URL" className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2 md:col-span-2" />
            <input type="number" min={1} max={10} value={settings.adsConfig.maxAdsPerPage} onChange={(e) => setSettings({ ...settings, adsConfig: { ...settings.adsConfig, maxAdsPerPage: Number(e.target.value) } })} placeholder="Max ads/page" className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2" />
            <input type="number" min={100} max={2000} value={settings.adsConfig.minWordsForAds} onChange={(e) => setSettings({ ...settings, adsConfig: { ...settings.adsConfig, minWordsForAds: Number(e.target.value) } })} placeholder="Min words for ads" className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2" />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <label className="flex items-center gap-2 text-sm text-slate-200"><input type="checkbox" checked={settings.adsConfig.routes.homepage} onChange={(e) => setSettings({ ...settings, adsConfig: { ...settings.adsConfig, routes: { ...settings.adsConfig.routes, homepage: e.target.checked } } })} />Homepage</label>
            <label className="flex items-center gap-2 text-sm text-slate-200"><input type="checkbox" checked={settings.adsConfig.routes.category} onChange={(e) => setSettings({ ...settings, adsConfig: { ...settings.adsConfig, routes: { ...settings.adsConfig.routes, category: e.target.checked } } })} />Category</label>
            <label className="flex items-center gap-2 text-sm text-slate-200"><input type="checkbox" checked={settings.adsConfig.routes.article} onChange={(e) => setSettings({ ...settings, adsConfig: { ...settings.adsConfig, routes: { ...settings.adsConfig.routes, article: e.target.checked } } })} />Article</label>
            <label className="flex items-center gap-2 text-sm text-slate-200"><input type="checkbox" checked={settings.adsConfig.routes.dictionaryIndex} onChange={(e) => setSettings({ ...settings, adsConfig: { ...settings.adsConfig, routes: { ...settings.adsConfig.routes, dictionaryIndex: e.target.checked } } })} />Dictionary Index</label>
            <label className="flex items-center gap-2 text-sm text-slate-200"><input type="checkbox" checked={settings.adsConfig.routes.symbolPage} onChange={(e) => setSettings({ ...settings, adsConfig: { ...settings.adsConfig, routes: { ...settings.adsConfig.routes, symbolPage: e.target.checked } } })} />Symbol Page</label>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input value={settings.adsConfig.slots.header} onChange={(e) => setSettings({ ...settings, adsConfig: { ...settings.adsConfig, slots: { ...settings.adsConfig.slots, header: e.target.value } } })} placeholder="Slot header" className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2" />
            <input value={settings.adsConfig.slots.inContent1} onChange={(e) => setSettings({ ...settings, adsConfig: { ...settings.adsConfig, slots: { ...settings.adsConfig.slots, inContent1: e.target.value } } })} placeholder="Slot inContent1" className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2" />
            <input value={settings.adsConfig.slots.inContent2} onChange={(e) => setSettings({ ...settings, adsConfig: { ...settings.adsConfig, slots: { ...settings.adsConfig.slots, inContent2: e.target.value } } })} placeholder="Slot inContent2" className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2" />
            <input value={settings.adsConfig.slots.sidebar} onChange={(e) => setSettings({ ...settings, adsConfig: { ...settings.adsConfig, slots: { ...settings.adsConfig.slots, sidebar: e.target.value } } })} placeholder="Slot sidebar" className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2" />
            <input value={settings.adsConfig.slots.footer} onChange={(e) => setSettings({ ...settings, adsConfig: { ...settings.adsConfig, slots: { ...settings.adsConfig.slots, footer: e.target.value } } })} placeholder="Slot footer" className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2" />
            <input value={settings.adsConfig.slots.mobileSticky} onChange={(e) => setSettings({ ...settings, adsConfig: { ...settings.adsConfig, slots: { ...settings.adsConfig.slots, mobileSticky: e.target.value } } })} placeholder="Slot mobileSticky" className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2" />
          </div>

          <button onClick={save} className="rounded-lg bg-[#8b5cf6] px-4 py-2 text-white">{saving ? 'Se salveaza...' : 'Salveaza Ads Settings'}</button>
        </div>
      )}

      {tab === 'robots' && (
        <div className="max-w-4xl space-y-4 rounded-xl border border-slate-700 bg-[#1e293b] p-6">
          <h1 className="text-xl font-semibold text-white">Robots</h1>
          <textarea value={settings.robotsTxt || ''} onChange={(e) => setSettings({ ...settings, robotsTxt: e.target.value })} rows={8} className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2 font-mono text-sm" />
          <label className="flex items-center gap-2 text-sm text-slate-200"><input type="checkbox" checked={settings.blockAiBots} onChange={(e) => setSettings({ ...settings, blockAiBots: e.target.checked })} />Blocheaza AI bots (GPTBot, CCBot, anthropic-ai, Claude-Web)</label>
          <button onClick={save} className="rounded-lg bg-[#8b5cf6] px-4 py-2 text-white">{saving ? 'Se salveaza...' : 'Salveaza robots'}</button>
          {robotsWarnings.length > 0 && <div className="space-y-1 rounded-lg border border-amber-700 bg-amber-950/40 p-3 text-sm text-amber-200">{robotsWarnings.map((w) => <div key={w}>- {w}</div>)}</div>}
          <div className="rounded-lg border border-slate-700 bg-[#0f172a] p-3"><div className="mb-2 text-sm text-slate-300">Preview efectiv</div><pre className="whitespace-pre-wrap font-mono text-xs text-slate-200">{effectiveRobots}</pre></div>
        </div>
      )}

      {tab === 'sitemap' && (
        <div className="max-w-4xl space-y-4 rounded-xl border border-slate-700 bg-[#1e293b] p-6">
          <h1 className="text-xl font-semibold text-white">Sitemap</h1>
          <p className="text-sm text-slate-300">Last generated: {lastGeneratedAt ? new Date(lastGeneratedAt).toLocaleString('ro-RO') : 'N/A'}</p>
          <p className="text-sm text-slate-300">Count URL-uri: {urlCount}</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => runSitemapAction('regenerate')} className="rounded-lg bg-[#8b5cf6] px-4 py-2 text-white">{working === 'regenerate' ? 'Regeneram...' : 'Regenereaza'}</button>
            <button onClick={() => window.open('/sitemap.xml', '_blank')} className="rounded-lg bg-slate-700 px-4 py-2 text-slate-100">Preview Sitemap</button>
            <button onClick={() => runSitemapAction('ping-google')} className="rounded-lg bg-slate-700 px-4 py-2 text-slate-100">{working === 'ping-google' ? 'Ping...' : 'Ping Google'}</button>
            <button onClick={() => runSitemapAction('ping-bing')} className="rounded-lg bg-slate-700 px-4 py-2 text-slate-100">{working === 'ping-bing' ? 'Ping...' : 'Ping Bing'}</button>
          </div>
          {statusMessage && <p className="text-sm text-slate-200">{statusMessage}</p>}
          {lastAttempts.length > 0 && <div className="space-y-1 rounded-lg border border-slate-700 bg-[#0f172a] p-3 text-xs text-slate-300">{lastAttempts.map((attempt) => <div key={attempt.attempt}>Incercarea {attempt.attempt}: {attempt.ok ? `OK (${attempt.status})` : `Eroare${attempt.status ? ` (${attempt.status})` : ''}${attempt.error ? ` - ${attempt.error}` : ''}`}</div>)}</div>}
        </div>
      )}

      {tab === 'publisher' && (
        <div className="max-w-4xl space-y-4 rounded-xl border border-slate-700 bg-[#1e293b] p-6">
          <h1 className="text-xl font-semibold text-white">Publisher</h1>
          <div className="text-sm text-slate-300">Endpoint: {siteUrl}/api/publisher/receive</div>
          <div className="space-y-2 rounded-lg border border-slate-700 bg-[#0f172a] p-4">
            <div className="text-sm text-slate-300">Token curent (mascat): {publisherTokenMasked || 'N/A'}</div>
            <div className="flex flex-wrap gap-2">
              <button className="rounded bg-slate-700 px-3 py-2 text-slate-100" onClick={regenerateToken}>Regenereaza token</button>
              <button className="rounded bg-slate-700 px-3 py-2 text-slate-100" onClick={() => publisherTokenValue && navigator.clipboard.writeText(publisherTokenValue)}>Copy token</button>
            </div>
            <input value={publisherTokenValue} onChange={(e) => setPublisherTokenValue(e.target.value)} placeholder="Token pentru test" className="w-full rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2" />
            <button className="rounded bg-[#8b5cf6] px-3 py-2 text-white" onClick={testConnection}>Test connection</button>
            {publisherStatus && <div className="text-sm text-slate-200">{publisherStatus}</div>}
          </div>
          <div className="rounded-lg border border-slate-700 bg-[#0f172a] p-4">
            <div className="mb-2 text-sm text-slate-300">Ultimele 10 postari primite</div>
            <div className="space-y-2 text-sm text-slate-200">
              {publisherItems.length === 0 && <div>Niciun post primit.</div>}
              {publisherItems.map((item) => <div key={item.id} className="flex justify-between gap-2"><div>{item.title}</div><div className="text-slate-400">{item.publisherCampaign || '-'} | {new Date(item.updatedAt).toLocaleDateString('ro-RO')}</div></div>)}
            </div>
          </div>
        </div>
      )}

      {tab === 'links' && (
        <div className="space-y-4 rounded-xl border border-slate-700 bg-[#1e293b] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-white">Internal Linking Report</h1>
              <p className="text-sm text-slate-400">Monitorizam paginile fara linkuri interne, cele sub pragul de 2 si modelele cele mai bine conectate.</p>
            </div>
            <button onClick={loadLinkReport} className="rounded-lg bg-slate-700 px-4 py-2 text-sm text-slate-100">{linksLoading ? 'Refresh...' : 'Refresh report'}</button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-xl bg-[#0f172a] p-4"><div className="text-xs text-slate-400">Auto-link safe mode</div><div className="mt-2 text-lg font-semibold text-white">{settings.enableAutoInternalLinks ? 'Activ' : 'Inactiv'}</div></div>
            <div className="rounded-xl bg-[#0f172a] p-4"><div className="text-xs text-slate-400">Posts fara linkuri</div><div className="mt-2 text-lg font-semibold text-rose-300">{linkReport?.summary.noInternalLinks ?? '-'}</div></div>
            <div className="rounded-xl bg-[#0f172a] p-4"><div className="text-xs text-slate-400">Posts sub 2 linkuri</div><div className="mt-2 text-lg font-semibold text-amber-300">{linkReport?.summary.underTwoInternalLinks ?? '-'}</div></div>
            <div className="rounded-xl bg-[#0f172a] p-4"><div className="text-xs text-slate-400">Posts bine conectate</div><div className="mt-2 text-lg font-semibold text-emerald-300">{linkReport?.summary.wellLinked ?? '-'}</div></div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-3 rounded-xl border border-slate-700 bg-[#0f172a] p-4">
              <h2 className="font-semibold text-white">Fara internal links</h2>
              <div className="space-y-2 text-sm text-slate-200">
                {linkReport?.noInternalLinks.length ? linkReport.noInternalLinks.map((row) => (
                  <div key={row.id} className="rounded-lg border border-slate-700 p-3">
                    <div className="font-medium text-white">{row.title}</div>
                    <div className="text-xs text-slate-400">{row.url}</div>
                    <div className="mt-1 text-xs text-rose-300">0 linkuri interne</div>
                  </div>
                )) : <div className="text-slate-400">Nu avem date sau toate paginile au linkuri.</div>}
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-700 bg-[#0f172a] p-4">
              <h2 className="font-semibold text-white">Sub pragul de 2</h2>
              <div className="space-y-2 text-sm text-slate-200">
                {linkReport?.underTwoInternalLinks.length ? linkReport.underTwoInternalLinks.map((row) => (
                  <div key={row.id} className="rounded-lg border border-slate-700 p-3">
                    <div className="font-medium text-white">{row.title}</div>
                    <div className="text-xs text-slate-400">{row.url}</div>
                    <div className="mt-1 text-xs text-amber-300">{row.linkCount} linkuri interne</div>
                  </div>
                )) : <div className="text-slate-400">Nu avem oportunitati urgente.</div>}
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-700 bg-[#0f172a] p-4">
              <h2 className="font-semibold text-white">Top pages by internal link count</h2>
              <div className="space-y-2 text-sm text-slate-200">
                {linkReport?.topPagesByInternalLinks.length ? linkReport.topPagesByInternalLinks.map((row) => (
                  <div key={row.id} className="rounded-lg border border-slate-700 p-3">
                    <div className="font-medium text-white">{row.title}</div>
                    <div className="text-xs text-slate-400">{row.url}</div>
                    <div className="mt-1 text-xs text-emerald-300">{row.linkCount} linkuri interne</div>
                  </div>
                )) : <div className="text-slate-400">Nu avem date suficiente.</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      <MediaPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(item) => {
          setSettings({ ...settings, defaultOgImage: item.urls?.webp || item.url })
          setPickerOpen(false)
        }}
      />
    </section>
  )
}
