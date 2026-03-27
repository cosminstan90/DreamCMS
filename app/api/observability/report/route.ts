import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getObservabilityReport } from '@/lib/observability/report'

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const daysParam = Number(searchParams.get('days') || '7')
  const days = daysParam === 30 ? 30 : 7
  const report = await getObservabilityReport(days)
  return NextResponse.json(report)
}