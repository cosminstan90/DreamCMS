type AffiliateBoxProps = {
  disclosure?: string
}

export function AffiliateBox({ disclosure }: AffiliateBoxProps) {
  return (
    <div className="rounded-[1.7rem] border border-[#ded1f5] bg-[linear-gradient(180deg,#fffdfa,#f7f1ff)] px-5 py-4 text-sm text-[#4f3d74] shadow-[0_18px_45px_rgba(84,56,128,0.05)]">
      <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-[#8a74aa]">selectie cu potential de conversie</div>
      <p className="leading-7 text-[#5f4b80]">
        {disclosure || 'Unele linkuri sunt afiliate. Selectam doar produse care au sens pentru cititoarele care vor sa aprofundeze starea, ritualul sau simbolurile discutate aici.'}
      </p>
    </div>
  )
}
