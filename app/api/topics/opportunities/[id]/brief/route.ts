import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { generateBriefForOpportunity } from '@/lib/content-ops/topic-authority'
import { requireCurrentSiteResponse } from '@/lib/sites/context'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { context, response } = await requireCurrentSiteResponse()
  if (response) return response
  if (!context) return NextResponse.json({ error: 'Active site configuration is missing' }, { status: 500 })

  try {
    const result = await generateBriefForOpportunity(context.site.id, params.id, session.user.id)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to generate brief' }, { status: 400 })
  }
}
