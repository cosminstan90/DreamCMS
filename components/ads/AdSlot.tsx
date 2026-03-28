'use client'

import { useEffect, useMemo } from 'react'
import { AdRouteKey, AdsConfig } from '@/lib/ads/config'

type AdSlotProps = {
  config: AdsConfig
  route: AdRouteKey
  slotKey: keyof AdsConfig['slots']
  pagePath: string
  className?: string
  label?: string
}

type AdsByGoogleWindow = Window & {
  adsbygoogle?: unknown[]
}

function trackAdEvent(eventType: 'impression' | 'click', payload: Record<string, unknown>) {
  void fetch('/api/ads/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventType, ...payload }),
    keepalive: true,
  })
}

function getSlotLabel(route: AdRouteKey, slotKey: keyof AdsConfig['slots']) {
  if (slotKey === 'header') return 'Selectie sustinuta de parteneri'
  if (slotKey === 'footer') return 'Recomandari sponsorizate'
  if (route === 'dictionaryIndex') return 'Descoperiri utile'
  if (route === 'symbolPage') return 'Context recomandat'
  return 'Continua lectura'
}

export function AdSlot({ config, route, slotKey, pagePath, className, label }: AdSlotProps) {
  const slotId = config.slots[slotKey]
  const enabled = config.enabled && config.routes[route]
  const elementId = useMemo(() => `${route}-${slotKey}-${slotId || 'empty'}`.replace(/[^a-zA-Z0-9-_]/g, ''), [route, slotKey, slotId])
  const slotLabel = label || getSlotLabel(route, slotKey)

  useEffect(() => {
    if (!enabled || !slotId) return

    trackAdEvent('impression', { route, slotKey, pagePath, provider: config.provider })

    if (config.provider !== 'adsense') return

    try {
      const w = window as AdsByGoogleWindow
      w.adsbygoogle = w.adsbygoogle || []
      w.adsbygoogle.push({})
    } catch {
      // ad networks can fail silently when blockers are active.
    }
  }, [enabled, slotId, route, slotKey, pagePath, config.provider])

  if (!enabled || !slotId) return null

  return (
    <section
      className={`overflow-hidden rounded-[1.85rem] border border-[#e8dcf8] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,242,255,0.86))] p-3 shadow-[0_18px_50px_rgba(84,56,128,0.06)] ${className || ''}`}
      onClick={() => trackAdEvent('click', { route, slotKey, pagePath, provider: config.provider })}
    >
      <div className="mb-3 flex items-center justify-between gap-3 rounded-[1.2rem] border border-[#efe7fb] bg-white/70 px-4 py-3 backdrop-blur">
        <div>
          <div className="text-[11px] uppercase tracking-[0.24em] text-[#8a74aa]">spatiu editorial sustinut</div>
          <div className="mt-1 text-sm font-medium text-[#3d2b61]">{slotLabel}</div>
        </div>
        <div className="rounded-full border border-[#ddd0f3] bg-[#faf7ff] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#7b67a5]">
          publicitate
        </div>
      </div>

      {config.provider === 'adsense' && config.publisherId ? (
        <ins
          id={elementId}
          className="adsbygoogle"
          style={{ display: 'block', minHeight: 120 }}
          data-ad-client={config.publisherId}
          data-ad-slot={slotId}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <div className="min-h-[120px] w-full rounded-[1.2rem] border border-dashed border-[#c9b7e9] bg-[#faf7ff] p-5 text-center text-xs text-[#6e5a98]" data-ad-slot={slotId}>
          Placeholder ad slot: {slotKey}
        </div>
      )}
    </section>
  )
}
