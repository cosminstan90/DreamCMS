'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { captureAttributionFromLocation, readAttribution } from '@/components/analytics/attribution'

function detectDeviceType() {
  const ua = navigator.userAgent.toLowerCase()
  if (/mobile|android|iphone|ipod/.test(ua)) return 'mobile'
  if (/ipad|tablet/.test(ua)) return 'tablet'
  return 'desktop'
}

export function FrontendTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return

    const attribution = captureAttributionFromLocation(pathname) || readAttribution() || null

    void fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: 'PAGE_VIEW',
        route: pathname,
        templateType: 'frontend',
        referrer: document.referrer || '',
        deviceType: detectDeviceType(),
        meta: attribution,
      }),
      keepalive: true,
    })
  }, [pathname])

  return null
}
