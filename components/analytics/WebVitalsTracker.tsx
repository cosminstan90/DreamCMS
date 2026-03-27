'use client'

import { usePathname } from 'next/navigation'
import { useReportWebVitals } from 'next/web-vitals'

type SupportedMetric = 'CLS' | 'FCP' | 'INP' | 'LCP' | 'TTFB'

function detectDeviceType() {
  const ua = navigator.userAgent.toLowerCase()
  if (/mobile|android|iphone|ipod/.test(ua)) return 'mobile'
  if (/ipad|tablet/.test(ua)) return 'tablet'
  return 'desktop'
}

function getConnectionType() {
  const nav = navigator as Navigator & {
    connection?: { effectiveType?: string; saveData?: boolean }
  }
  return nav.connection || null
}

export function WebVitalsTracker() {
  const pathname = usePathname()

  useReportWebVitals((metric) => {
    const name = metric.name as SupportedMetric
    if (!pathname) return
    if (!['CLS', 'FCP', 'INP', 'LCP', 'TTFB'].includes(name)) return

    const connection = getConnectionType()

    void fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        eventType: 'WEB_VITAL',
        route: pathname,
        templateType: 'frontend',
        deviceType: detectDeviceType(),
        meta: {
          metric: name,
          id: metric.id,
          value: Number(metric.value.toFixed(name === 'CLS' ? 3 : 0)),
          delta: Number(metric.delta.toFixed(name === 'CLS' ? 3 : 0)),
          rating: metric.rating,
          navigationType: metric.navigationType || 'unknown',
          connectionType: connection?.effectiveType || null,
          saveData: connection?.saveData || false,
        },
      }),
    })
  })

  return null
}