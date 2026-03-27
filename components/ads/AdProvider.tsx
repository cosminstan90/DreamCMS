'use client'

import Script from 'next/script'
import { AdsConfig } from '@/lib/ads/config'

type AdProviderProps = {
  config: AdsConfig
  children: React.ReactNode
}

export function AdProvider({ config, children }: AdProviderProps) {
  const shouldLoad = config.enabled && Boolean(config.publisherId)

  return (
    <>
      {shouldLoad && (
        <Script
          id="ads-provider-script"
          src={config.scriptUrl}
          data-ad-client={config.publisherId}
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      )}
      {children}
    </>
  )
}
