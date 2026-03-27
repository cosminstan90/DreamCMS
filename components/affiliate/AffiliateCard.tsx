/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'

type AffiliateCardProps = {
  id: string
  title: string
  affiliateUrl: string
  image?: string | null
  priceText?: string | null
  badge?: string | null
  merchant?: string | null
  pagePath: string
  templateType: string
}

export function AffiliateCard(props: AffiliateCardProps) {
  const { id, title, affiliateUrl, image, priceText, badge, merchant, pagePath, templateType } = props
  const target = `/api/affiliate/click/${id}?to=${encodeURIComponent(affiliateUrl)}&page=${encodeURIComponent(pagePath)}&template=${encodeURIComponent(templateType)}`

  return (
    <article className="rounded-2xl border border-[#e4daf5] bg-white p-4">
      {badge && <div className="mb-2 inline-flex rounded-full bg-[#f2ebff] px-2 py-1 text-xs text-[#5b4694]">{badge}</div>}
      {image && <img src={image} alt={title} className="mb-3 h-40 w-full rounded-xl object-cover" loading="lazy" />}
      <h3 className="font-semibold text-[#2f2050]">{title}</h3>
      {merchant && <div className="mt-1 text-xs text-[#6f5a92]">{merchant}</div>}
      {priceText && <div className="mt-2 text-sm font-medium text-[#3f2b63]">{priceText}</div>}
      <Link href={target} rel="nofollow sponsored noopener" target="_blank" className="mt-3 inline-flex rounded-lg bg-[#8b5cf6] px-3 py-2 text-sm text-white hover:bg-[#7c3aed]">
        Vezi oferta
      </Link>
    </article>
  )
}
