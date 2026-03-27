'use client'

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

type HeaderUser = {
  name?: string | null
  email?: string | null
}

function titleFromSegment(segment: string): string {
  const map: Record<string, string> = {
    dashboard: 'Dashboard',
    posts: 'Articole',
    symbols: 'Dictionar Simboluri',
    categories: 'Categorii',
    media: 'Media',
    redirects: 'Redirecturi',
    settings: 'Setari SEO',
    backup: 'Backup',
  }

  return map[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
}

export function Header({ user }: { user: HeaderUser }) {
  const pathname = usePathname()

  const { title, breadcrumb } = useMemo(() => {
    const parts = pathname.split('/').filter(Boolean)
    const section = parts[1] || 'dashboard'
    const rest = parts.slice(2)

    const labels = ['Admin', titleFromSegment(section), ...rest.map(titleFromSegment)]
    return {
      title: labels[labels.length - 1],
      breadcrumb: labels.join(' / '),
    }
  }, [pathname])

  return (
    <header className="h-16 bg-[#0f172a] border-b border-slate-700 flex items-center justify-between px-8 sticky top-0 z-10 w-full">
      <div className="min-w-0">
        <h1 className="text-white font-semibold truncate">{title}</h1>
        <p className="text-xs text-slate-400 truncate">{breadcrumb}</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-sm text-slate-300">
          Utilizator: <span className="font-semibold text-white">{user?.name || user?.email || 'admin'}</span>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-sm px-3 py-1.5 rounded-lg border border-slate-700 text-slate-200 hover:bg-slate-800 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  )
}
