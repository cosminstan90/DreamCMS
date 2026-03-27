'use client'

import { useEffect, useMemo } from 'react'
import { AdRouteKey, AdsConfig } from '@/lib/ads/config'

type AdSlotProps = {
  config: AdsConfig
  route: AdRouteKey
  slotKey: keyof AdsConfig['slots']
  pagePath: string
  className?: string
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

export function AdSlot({ config, route, slotKey, pagePath, className }: AdSlotProps) {
  const slotId = config.slots[slotKey]
  const enabled = config.enabled && config.routes[route]
  const elementId = useMemo(() => `${route}-${slotKey}-${slotId || 'empty'}`.replace(/[^a-zA-Z0-9-_]/g, ''), [route, slotKey, slotId])

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
    <div
      className={`rounded-2xl border border-[#dfd6f1] bg-white p-2 ${className || ''}`}
      onClick={() => trackAdEvent('click', { route, slotKey, pagePath, provider: config.provider })}
    >
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
        <div className="min-h-[120px] w-full rounded-xl border border-dashed border-[#c9b7e9] bg-[#faf7ff] p-4 text-center text-xs text-[#6e5a98]" data-ad-slot={slotId}>
          Ad Slot: {slotKey}
        </div>
      )}
    </div>
  )
}
