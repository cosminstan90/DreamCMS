'use client'

export type AttributionData = {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  firstReferrer?: string
  landingPath?: string
}

const STORAGE_KEY = 'dreamcms_attribution'

function normalize(value: string | null | undefined) {
  const v = String(value || '').trim()
  return v || undefined
}

export function readAttribution(): AttributionData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AttributionData
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

export function writeAttribution(next: AttributionData) {
  if (typeof window === 'undefined') return
  const current = readAttribution() || {}
  const merged: AttributionData = {
    ...current,
    ...Object.fromEntries(Object.entries(next).filter(([, value]) => Boolean(value))),
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
}

export function captureAttributionFromLocation(pathname: string) {
  if (typeof window === 'undefined') return null

  const url = new URL(window.location.href)
  const payload: AttributionData = {
    utmSource: normalize(url.searchParams.get('utm_source')),
    utmMedium: normalize(url.searchParams.get('utm_medium')),
    utmCampaign: normalize(url.searchParams.get('utm_campaign')),
    utmContent: normalize(url.searchParams.get('utm_content')),
    utmTerm: normalize(url.searchParams.get('utm_term')),
    landingPath: pathname,
    firstReferrer: normalize(document.referrer),
  }

  writeAttribution(payload)
  return readAttribution()
}
