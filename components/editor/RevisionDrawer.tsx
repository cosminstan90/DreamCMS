'use client'

type Revision = {
  version: number
  savedAt: string
  userId: string
  title?: string
  contentJson?: unknown
  contentHtml?: string
  metaTitle?: string
  metaDescription?: string
  name?: string
  shortDefinition?: string
  fullContent?: string
}

type RevisionDrawerProps = {
  open: boolean
  revisions: Revision[]
  onClose: () => void
  onRestore: (revision: Revision) => void
}

export function RevisionDrawer({ open, revisions, onClose, onRestore }: RevisionDrawerProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
      <aside className="w-full max-w-xl h-full bg-[#1e293b] border-l border-slate-700 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Istoric Revizii</h3>
          <button onClick={onClose} className="px-3 py-1 rounded border border-slate-700 text-slate-200">
            Inchide
          </button>
        </div>

        <div className="space-y-3">
          {[...revisions].reverse().map((revision) => (
            <div key={`${revision.version}-${revision.savedAt}`} className="rounded-lg border border-slate-700 p-3 bg-[#0f172a]">
              <div className="text-sm text-white font-medium">Versiunea {revision.version}</div>
              <div className="text-xs text-slate-400">{new Date(revision.savedAt).toLocaleString()} - user {revision.userId}</div>

              <div className="mt-3 p-2 rounded bg-slate-900 text-xs text-slate-300 max-h-44 overflow-auto whitespace-pre-wrap">
                {revision.title || revision.name || 'Fara titlu'}
                {'\n'}
                {(revision.contentHtml || revision.fullContent || '').slice(0, 500)}
              </div>

              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => onRestore(revision)}
                  className="px-3 py-1.5 rounded bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-sm"
                >
                  Restaureaza aceasta versiune
                </button>
              </div>
            </div>
          ))}

          {revisions.length === 0 && <div className="text-sm text-slate-400">Nu exista revizii inca.</div>}
        </div>
      </aside>
    </div>
  )
}
