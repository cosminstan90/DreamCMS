import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { generateRevenueReport } from '@/lib/analytics/revenue-report'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const url = new URL(req.url)
  const days = Number(url.searchParams.get('days') || '30')
  const report = await generateRevenueReport(days)
  return NextResponse.json(report)
}
