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
    <article className="group overflow-hidden rounded-[1.9rem] border border-[#e4daf5] bg-[linear-gradient(180deg,#ffffff,#faf5ff)] p-4 shadow-[0_18px_50px_rgba(84,56,128,0.05)] transition-transform duration-300 hover:-translate-y-1">
      {image && <img src={image} alt={title} className="mb-4 h-44 w-full rounded-[1.3rem] object-cover" loading="lazy" />}
      <div className="flex items-start justify-between gap-3">
        <div>
          {badge && <div className="mb-2 inline-flex rounded-full border border-[#ddd1f7] bg-[#f6f1ff] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#6a56a3]">{badge}</div>}
          <h3 className="font-semibold leading-7 text-[#2f2050]">{title}</h3>
        </div>
      </div>
      {merchant && <div className="mt-2 text-xs uppercase tracking-[0.16em] text-[#8a74aa]">{merchant}</div>}
      {priceText && <div className="mt-3 text-sm font-medium text-[#3f2b63]">{priceText}</div>}
      <div className="mt-4 flex items-center justify-between gap-4 border-t border-[#ece4fa] pt-4">
        <div className="text-xs leading-6 text-[#6f5a92]">Selectie relevanta pentru cititoarele care vor un pas urmator practic.</div>
        <Link href={target} rel="nofollow sponsored noopener" target="_blank" className="inline-flex shrink-0 rounded-full bg-[#8b5cf6] px-4 py-2 text-sm text-white transition-colors hover:bg-[#7c3aed]">
          Vezi oferta
        </Link>
      </div>
    </article>
  )
}
