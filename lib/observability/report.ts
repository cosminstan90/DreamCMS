import { AnalyticsEventType } from '@prisma/client'
import { prisma } from '@/lib/prisma'

type Period = 7 | 30

type VitalMetricName = 'CLS' | 'FCP' | 'INP' | 'LCP' | 'TTFB'

type MetricValue = {
  route: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor' | 'unknown'
  deviceType: string | null
  createdAt: Date
}

const METRIC_ORDER: VitalMetricName[] = ['LCP', 'INP', 'CLS', 'TTFB', 'FCP']

function asObject(value: unknown) {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function percentile(values: number[], p: number) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1))
  return sorted[index]
}

function round(value: number, digits = 2) {
  const power = 10 ** digits
  return Math.round(value * power) / power
}

function normalizeRating(value: unknown): MetricValue['rating'] {
  if (value === 'good' || value === 'needs-improvement' || value === 'poor') return value
  return 'unknown'
}

function getMetricName(meta: Record<string, unknown>): VitalMetricName | null {
  const raw = meta.metric
  if (raw === 'CLS' || raw === 'FCP' || raw === 'INP' || raw === 'LCP' || raw === 'TTFB') return raw
  return null
}

function computeMetricSummary(name: VitalMetricName, rows: MetricValue[]) {
  const values = rows.map((row) => row.value)
  return {
    metric: name,
    samples: rows.length,
    average: rows.length ? round(values.reduce((sum, value) => sum + value, 0) / rows.length, name === 'CLS' ? 3 : 0) : 0,
    p75: rows.length ? round(percentile(values, 75), name === 'CLS' ? 3 : 0) : 0,
    good: rows.filter((row) => row.rating === 'good').length,
    needsImprovement: rows.filter((row) => row.rating === 'needs-improvement').length,
    poor: rows.filter((row) => row.rating === 'poor').length,
  }
}

function routeScoreFromMetrics(metrics: MetricValue[]) {
  if (!metrics.length) return 100
  let score = 100
  for (const metric of metrics) {
    if (metric.rating === 'poor') score -= 18
    else if (metric.rating === 'needs-improvement') score -= 8
    else if (metric.rating === 'unknown') score -= 4
  }
  return Math.max(0, score)
}

export async function getObservabilityReport(days: Period = 7) {
  const since = new Date()
  since.setDate(since.getDate() - days)

  const [events, pageViews, latestBackup] = await Promise.all([
    prisma.analyticsEvent.findMany({
      where: {
        createdAt: { gte: since },
        eventType: { in: ['WEB_VITAL', 'CLIENT_ERROR'] as AnalyticsEventType[] },
      },
      select: {
        id: true,
        route: true,
        eventType: true,
        deviceType: true,
        meta: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 2000,
    }),
    prisma.analyticsEvent.groupBy({
      by: ['route'],
      where: {
        createdAt: { gte: since },
        eventType: 'PAGE_VIEW',
      },
      _count: { route: true },
    }),
    prisma.backupLog.findFirst({ orderBy: { createdAt: 'desc' } }),
  ])

  const pageViewMap = new Map(pageViews.map((row) => [row.route, row._count.route]))
  const vitalMap = new Map<VitalMetricName, MetricValue[]>()
  const routeMap = new Map<string, MetricValue[]>()
  const errorRows: Array<{
    id: string
    route: string
    message: string
    source: string
    countHint: number
    createdAt: Date
  }> = []

  for (const event of events) {
    const meta = asObject(event.meta)
    if (!meta) continue

    if (event.eventType === 'WEB_VITAL') {
      const metric = getMetricName(meta)
      const value = Number(meta.value)
      if (!metric || Number.isNaN(value)) continue
      const row: MetricValue = {
        route: event.route,
        value,
        rating: normalizeRating(meta.rating),
        deviceType: event.deviceType,
        createdAt: event.createdAt,
      }
      const metricRows = vitalMap.get(metric) || []
      metricRows.push(row)
      vitalMap.set(metric, metricRows)

      const routeRows = routeMap.get(event.route) || []
      routeRows.push(row)
      routeMap.set(event.route, routeRows)
    }

    if (event.eventType === 'CLIENT_ERROR') {
      errorRows.push({
        id: event.id,
        route: event.route,
        message: String(meta.message || 'Unknown client error'),
        source: String(meta.source || 'window'),
        countHint: Number(meta.count || 1) || 1,
        createdAt: event.createdAt,
      })
    }
  }

  const metrics = METRIC_ORDER.map((metric) => computeMetricSummary(metric, vitalMap.get(metric) || []))

  const poorPages = Array.from(routeMap.entries())
    .map(([route, rows]) => {
      const byMetric = METRIC_ORDER.map((metric) => {
        const current = rows.filter((row) => vitalMap.has(metric) && row.route === route && (vitalMap.get(metric) || []).includes(row))
        return {
          metric,
          poor: current.filter((row) => row.rating === 'poor').length,
          needsImprovement: current.filter((row) => row.rating === 'needs-improvement').length,
          average: current.length ? round(current.reduce((sum, row) => sum + row.value, 0) / current.length, metric === 'CLS' ? 3 : 0) : 0,
        }
      })
      return {
        route,
        pageViews: pageViewMap.get(route) || 0,
        score: routeScoreFromMetrics(rows),
        poorEvents: rows.filter((row) => row.rating === 'poor').length,
        needsImprovementEvents: rows.filter((row) => row.rating === 'needs-improvement').length,
        samples: rows.length,
        metrics: byMetric.filter((entry) => entry.poor > 0 || entry.needsImprovement > 0),
      }
    })
    .sort((a, b) => a.score - b.score || b.poorEvents - a.poorEvents || b.pageViews - a.pageViews)
    .slice(0, 12)

  const errorDigestMap = new Map<string, { route: string; message: string; count: number; lastSeen: Date }>()
  for (const row of errorRows) {
    const key = `${row.route}::${row.message}`
    const current = errorDigestMap.get(key)
    if (current) {
      current.count += row.countHint
      if (row.createdAt > current.lastSeen) current.lastSeen = row.createdAt
    } else {
      errorDigestMap.set(key, {
        route: row.route,
        message: row.message,
        count: row.countHint,
        lastSeen: row.createdAt,
      })
    }
  }

  const topErrors = Array.from(errorDigestMap.values())
    .sort((a, b) => b.count - a.count || b.lastSeen.getTime() - a.lastSeen.getTime())
    .slice(0, 10)
    .map((row) => ({
      ...row,
      lastSeen: row.lastSeen.toISOString(),
    }))

  const totalVitalSamples = metrics.reduce((sum, row) => sum + row.samples, 0)
  const totalPoor = metrics.reduce((sum, row) => sum + row.poor, 0)
  const totalNeedsImprovement = metrics.reduce((sum, row) => sum + row.needsImprovement, 0)
  const avgScore = poorPages.length
    ? Math.round(poorPages.reduce((sum, row) => sum + row.score, 0) / poorPages.length)
    : 100

  const now = new Date()
  const lastBackupAgeHours = latestBackup ? round((now.getTime() - latestBackup.createdAt.getTime()) / 3600000, 1) : null

  return {
    summary: {
      days,
      totalVitalSamples,
      totalClientErrors: errorRows.length,
      totalPoor,
      totalNeedsImprovement,
      avgScore,
    },
    metrics,
    poorPages,
    topErrors,
    health: {
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: now.toISOString(),
      backup: latestBackup
        ? {
            status: latestBackup.status,
            createdAt: latestBackup.createdAt.toISOString(),
            ageHours: lastBackupAgeHours,
          }
        : null,
    },
  }
}