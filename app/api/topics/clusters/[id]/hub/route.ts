import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createHubDraftFromCluster } from '@/lib/content-ops/topic-authority'
import { requireCurrentSiteResponse } from '@/lib/sites/context'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { context, response } = await requireCurrentSiteResponse()
  if (response) return response
  if (!context) return NextResponse.json({ error: 'Active site configuration is missing' }, { status: 500 })

  try {
    const post = await createHubDraftFromCluster(context.site.id, params.id, session.user.id)
    return NextResponse.json({ success: true, post })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to create hub draft' }, { status: 400 })
  }
}
