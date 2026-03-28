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
    <section className="mt-12">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:items-end">
        <div>
          <div className="mb-3 text-[11px] uppercase tracking-[0.24em] text-[#8a74aa]">selectii recomandate</div>
          <h2 className="font-serif text-3xl text-[#2f2050] md:text-4xl">{title || 'Produse recomandate'}</h2>
          <p className="mt-3 max-w-md text-sm leading-7 text-[#5f4b80]">
            Produse si resurse care pot continua starea acestei pagini intr-un mod practic, calm si relevant pentru intentia cititoarei.
          </p>
        </div>
        <AffiliateBox />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
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
