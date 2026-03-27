'use client'

import { useEffect } from 'react'
import { AffiliateCard } from './AffiliateCard'
import { AffiliateBox } from './AffiliateBox'

type Product = {
  id: string
  title: string
  slug: string
  affiliateUrl: string
  image?: string | null
  priceText?: string | null
  badge?: string | null
  merchant?: string | null
  network?: string | null
  category?: string | null
}

type RecommendedProductsProps = {
  products: Product[]
  pagePath: string
  templateType: 'article' | 'symbol'
  title?: string
}

export function RecommendedProducts({ products, pagePath, templateType, title }: RecommendedProductsProps) {
  useEffect(() => {
    if (!products.length) return
    void fetch('/api/affiliate/placement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productIds: products.map((entry) => entry.id),
        pagePath,
        templateType,
      }),
      keepalive: true,
    })
  }, [products, pagePath, templateType])

  if (!products.length) return null

  return (
    <section className="mt-12 space-y-4">
      <h2 className="text-2xl font-semibold text-[#2f2050]">{title || 'Produse recomandate'}</h2>
      <AffiliateBox />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {products.map((product) => (
          <AffiliateCard
            key={product.id}
            id={product.id}
            title={product.title}
            affiliateUrl={product.affiliateUrl}
            image={product.image}
            priceText={product.priceText}
            badge={product.badge}
            merchant={product.merchant}
            pagePath={pagePath}
            templateType={templateType}
          />
        ))}
      </div>
    </section>
  )
}
