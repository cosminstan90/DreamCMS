type AffiliateBoxProps = {
  disclosure?: string
}

export function AffiliateBox({ disclosure }: AffiliateBoxProps) {
  return (
    <div className="rounded-xl border border-[#dbcdf6] bg-[#f8f4ff] px-4 py-3 text-sm text-[#4f3d74]">
      {disclosure || 'Unele linkuri sunt afiliate. Putem primi un comision, fara cost suplimentar pentru tine.'}
    </div>
  )
}
