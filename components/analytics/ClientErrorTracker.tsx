'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

function detectDeviceType() {
  const ua = navigator.userAgent.toLowerCase()
  if (/mobile|android|iphone|ipod/.test(ua)) return 'mobile'
  if (/ipad|tablet/.test(ua)) return 'tablet'
  return 'desktop'
}

function sendClientError(payload: Record<string, unknown>) {
  void fetch('/api/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    body: JSON.stringify(payload),
  })
}

export function ClientErrorTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return

    function onError(event: ErrorEvent) {
      sendClientError({
        eventType: 'CLIENT_ERROR',
        route: pathname,
        templateType: 'frontend',
        deviceType: detectDeviceType(),
        meta: {
          source: 'window.onerror',
          message: event.message || 'Unknown error',
          filename: event.filename || null,
          lineno: event.lineno || null,
          colno: event.colno || null,
          stack: event.error?.stack ? String(event.error.stack).slice(0, 1200) : null,
        },
      })
    }

    function onUnhandledRejection(event: PromiseRejectionEvent) {
      const reason = event.reason instanceof Error
        ? { message: event.reason.message, stack: event.reason.stack }
        : { message: String(event.reason), stack: null }

      sendClientError({
        eventType: 'CLIENT_ERROR',
        route: pathname,
        templateType: 'frontend',
        deviceType: detectDeviceType(),
        meta: {
          source: 'unhandledrejection',
          message: reason.message,
          stack: reason.stack ? String(reason.stack).slice(0, 1200) : null,
        },
      })
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)

    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [pathname])

  return null
}