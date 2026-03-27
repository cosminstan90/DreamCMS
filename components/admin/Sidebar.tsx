'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ArrowLeftRight,
  BookOpen,
  Database,
  BadgeDollarSign,
  BarChart3,
  FileText,
  FolderTree,
  Image as ImageIcon,
  LayoutDashboard,
  Mail,
  Activity,
  LineChart,
  Settings,
  Target,
  Users,
  RefreshCw,
} from 'lucide-react'

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/reports', icon: BarChart3, label: 'Reports' },
  { href: '/admin/observability', icon: Activity, label: 'Observability' },
  { href: '/admin/growth', icon: LineChart, label: 'Growth Intel' },
  { href: '/admin/authors', icon: Users, label: 'Autori' },
  { href: '/admin/posts', icon: FileText, label: 'Articole' },
  { href: '/admin/symbols', icon: BookOpen, label: 'Dictionar Simboluri' },
  { href: '/admin/categories', icon: FolderTree, label: 'Categorii' },
  { href: '/admin/media', icon: ImageIcon, label: 'Media' },
  { href: '/admin/redirects', icon: ArrowLeftRight, label: 'Redirecturi' },
  { href: '/admin/affiliate', icon: BadgeDollarSign, label: 'Affiliate' },
  { href: '/admin/newsletter', icon: Mail, label: 'Newsletter' },
  { href: '/admin/topics', icon: Target, label: 'Topic Authority' },
  { href: '/admin/refresh', icon: RefreshCw, label: 'Refresh Ops' },
  { href: '/admin/seo', icon: Settings, label: 'Setari SEO' },
  { href: '/admin/backup', icon: Database, label: 'Backup' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-[240px] flex-col border-r border-slate-700 bg-[#1e293b]">
      <div className="flex h-16 items-center border-b border-slate-700 px-5">
        <span className="mr-2 text-xl" aria-hidden>
          Luna
        </span>
        <span className="text-lg font-bold tracking-tight text-white">DreamCMS</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'border border-[#8b5cf6]/30 bg-[#8b5cf6]/20 text-[#c4b5fd]'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
