import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { syncTopicAuthority } from '@/lib/content-ops/topic-authority'
import { syncStaleContentEngine } from '@/lib/content-ops/stale-content'
import { requireCurrentSiteResponse } from '@/lib/sites/context'

export async function POST() {
  const session = await auth()
  if (session?.user?.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { context, response } = await requireCurrentSiteResponse()
  if (response) return response
  if (!context) return NextResponse.json({ error: 'Active site configuration is missing' }, { status: 500 })

  const [total, refresh] = await Promise.all([
    syncTopicAuthority(context.site.id, session.user.id),
    syncStaleContentEngine(context.site.id),
  ])

  return NextResponse.json({
    success: true,
    totalOpportunities: total,
    refresh,
  })
}
