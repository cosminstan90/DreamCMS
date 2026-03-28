'use client'

type SerpPreviewProps = {
  title: string
  slug: string
  categorySlug?: string
  description: string
}

function truncateByPixels(text: string, maxPixels: number, pxPerChar = 9.5) {
  const maxChars = Math.floor(maxPixels / pxPerChar)
  if (text.length <= maxChars) return text
  return text.slice(0, Math.max(0, maxChars - 3)).trim() + '...'
}

export function SerpPreview({ title, slug, categorySlug, description }: SerpPreviewProps) {
  const breadcrumb = `pagani.ro ${categorySlug ? `> ${categorySlug}` : ''} > ${slug}`
  const truncatedTitle = truncateByPixels(title, 600)

  return (
    <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4 space-y-2">
      <div className="text-xs text-emerald-400">{breadcrumb}</div>
      <div className="text-blue-400 text-base font-semibold">{truncatedTitle}</div>
      <div className="text-xs text-slate-400">{description || 'Adauga o descriere atractiva pentru rezultate Google.'}</div>
      <div className="h-2 bg-slate-800 rounded-full relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-blue-500/60" style={{ width: `${Math.min(100, (title.length * 9.5) / 6)}%` }} />
      </div>
      <div className="text-[10px] text-slate-500">Pixel ruler: 600px</div>
    </div>
  )
}
