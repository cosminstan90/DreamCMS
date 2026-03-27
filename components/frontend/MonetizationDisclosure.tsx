type MonetizationDisclosureProps = {
  hasAffiliate?: boolean
  hasAds?: boolean
}

export function MonetizationDisclosure({ hasAffiliate, hasAds }: MonetizationDisclosureProps) {
  if (!hasAffiliate && !hasAds) return null

  return (
    <aside className="mt-8 rounded-2xl border border-[#eadfcb] bg-[#fff7ec] p-4 text-sm text-[#6d5430]">
      <strong className="text-[#4f3614]">Transparenta:</strong>{' '}
      {hasAffiliate && hasAds
        ? 'aceasta pagina poate contine linkuri afiliate si unitati publicitare. Putem primi un comision fara cost suplimentar pentru tine.'
        : hasAffiliate
          ? 'aceasta pagina poate contine linkuri afiliate. Putem primi un comision fara cost suplimentar pentru tine.'
          : 'aceasta pagina poate include unitati publicitare marcate clar.'}
    </aside>
  )
}