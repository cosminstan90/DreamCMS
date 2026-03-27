import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { importSearchInsights } from '@/lib/growth/intelligence'
import { requireCurrentSiteResponse } from '@/lib/sites/context'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { context, response } = await requireCurrentSiteResponse()
  if (response) return response
  if (!context) return NextResponse.json({ error: 'Active site configuration is missing' }, { status: 500 })

  const body = await request.json()
  const csvText = typeof body?.csvText === 'string' ? body.csvText : ''
  const source = typeof body?.source === 'string' ? body.source : 'manual'

  if (!csvText.trim()) {
    return NextResponse.json({ error: 'csvText is required' }, { status: 400 })
  }

  try {
    const result = await importSearchInsights(context.site.id, csvText, source)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Import failed' }, { status: 400 })
  }
}
