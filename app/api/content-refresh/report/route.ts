import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getStaleContentReport } from '@/lib/content-ops/stale-content'
import { requireCurrentSiteResponse } from '@/lib/sites/context'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { context, response } = await requireCurrentSiteResponse()
  if (response) return response
  if (!context) return NextResponse.json({ error: 'Active site configuration is missing' }, { status: 500 })

  const report = await getStaleContentReport(context.site.id)
  return NextResponse.json(report)
}
