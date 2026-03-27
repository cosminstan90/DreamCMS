import type { RevenueReport } from '@/lib/analytics/revenue-report'

export type RevenueAlertThresholds = {
  minAdCtr: number
  minAffiliateCtr: number
  minNewsletterCvr: number
  minEstimatedRevenue: number
}

export type RevenueAlertItem = {
  code: string
  label: string
  current: number
  threshold: number
}

export function getRevenueAlertThresholds(): RevenueAlertThresholds {
  const fromEnv = (key: string, fallback: number) => {
    const raw = process.env[key]
    const num = raw ? Number(raw) : NaN
    return Number.isFinite(num) ? num : fallback
  }

  return {
    minAdCtr: fromEnv('ALERT_MIN_AD_CTR', 0.7),
    minAffiliateCtr: fromEnv('ALERT_MIN_AFFILIATE_CTR', 0.15),
    minNewsletterCvr: fromEnv('ALERT_MIN_NEWSLETTER_CVR', 0.2),
    minEstimatedRevenue: fromEnv('ALERT_MIN_ESTIMATED_REVENUE', 5),
  }
}

export function evaluateRevenueAlerts(report: RevenueReport, thresholds: RevenueAlertThresholds): RevenueAlertItem[] {
  const alerts: RevenueAlertItem[] = []

  if (report.totals.adCtr < thresholds.minAdCtr) {
    alerts.push({
      code: 'LOW_AD_CTR',
      label: 'Ad CTR sub prag',
      current: report.totals.adCtr,
      threshold: thresholds.minAdCtr,
    })
  }

  if (report.totals.affiliateCtr < thresholds.minAffiliateCtr) {
    alerts.push({
      code: 'LOW_AFFILIATE_CTR',
      label: 'Affiliate CTR sub prag',
      current: report.totals.affiliateCtr,
      threshold: thresholds.minAffiliateCtr,
    })
  }

  if (report.totals.newsletterCvr < thresholds.minNewsletterCvr) {
    alerts.push({
      code: 'LOW_NEWSLETTER_CVR',
      label: 'Newsletter CVR sub prag',
      current: report.totals.newsletterCvr,
      threshold: thresholds.minNewsletterCvr,
    })
  }

  if (report.totals.estimatedTotalRevenue < thresholds.minEstimatedRevenue) {
    alerts.push({
      code: 'LOW_ESTIMATED_REVENUE',
      label: 'Venit estimat total sub prag',
      current: report.totals.estimatedTotalRevenue,
      threshold: thresholds.minEstimatedRevenue,
    })
  }

  return alerts
}
