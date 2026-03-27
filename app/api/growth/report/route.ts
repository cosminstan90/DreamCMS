import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getGrowthReport } from '@/lib/growth/intelligence'
import { requireCurrentSiteResponse } from '@/lib/sites/context'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { context, response } = await requireCurrentSiteResponse()
  if (response) return response
  if (!context) return NextResponse.json({ error: 'Active site configuration is missing' }, { status: 500 })

  const report = await getGrowthReport(context.site.id)
  return NextResponse.json(report)
}
