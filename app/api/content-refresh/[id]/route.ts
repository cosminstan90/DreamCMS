import { NextResponse } from 'next/server'
import { RefreshStatus } from '@prisma/client'
import { auth } from '@/auth'
import { updateRefreshState } from '@/lib/content-ops/stale-content'
import { requireCurrentSiteResponse } from '@/lib/sites/context'

const VALID_STATUSES: RefreshStatus[] = ['FRESH', 'WATCH', 'REFRESH_NEEDED', 'IN_REFRESH', 'REFRESHED']

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { context, response } = await requireCurrentSiteResponse()
  if (response) return response
  if (!context) return NextResponse.json({ error: 'Active site configuration is missing' }, { status: 500 })

  const { id } = params
  const body = await request.json()
  const nextStatus = body?.refreshStatus

  if (nextStatus && !VALID_STATUSES.includes(nextStatus)) {
    return NextResponse.json({ error: 'Invalid refreshStatus' }, { status: 400 })
  }

  try {
    const updated = await updateRefreshState(context.site.id, id, {
      refreshStatus: nextStatus,
      refreshNotes: typeof body?.refreshNotes === 'string' ? body.refreshNotes : undefined,
      markReviewed: Boolean(body?.markReviewed),
    })

    return NextResponse.json({ success: true, post: updated })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Update failed' }, { status: 400 })
  }
}
