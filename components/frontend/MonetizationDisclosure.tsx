type MonetizationDisclosureProps = {
  hasAffiliate?: boolean
  hasAds?: boolean
}

export function MonetizationDisclosure({ hasAffiliate, hasAds }: MonetizationDisclosureProps) {
  if (!hasAffiliate && !hasAds) return null

  return (
    <aside className="rounded-[1.8rem] border border-[#eadff7] bg-[linear-gradient(180deg,#fffdfa,#faf5ff)] p-5 text-sm text-[#6b568f] shadow-[0_16px_40px_rgba(84,56,128,0.05)]">
      <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-[#8a74aa]">transparenta editoriala</div>
      <p className="leading-7 text-[#5f4b80]">
        <strong className="font-semibold text-[#3f2b63]">Sustinem publicatia responsabil.</strong>{' '}
        {hasAffiliate && hasAds
          ? 'Aceasta pagina poate include atat recomandari afiliate, cat si spatii publicitare marcate clar. Putem primi un comision fara cost suplimentar pentru tine.'
          : hasAffiliate
            ? 'Aceasta pagina poate include recomandari afiliate selectate editorial. Putem primi un comision fara cost suplimentar pentru tine.'
            : 'Aceasta pagina poate include spatii publicitare marcate clar, integrate in ritmul lecturii.'}
      </p>
    </aside>
  )
}
