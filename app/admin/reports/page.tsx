'use client'

import { useEffect, useMemo, useState } from 'react'

type TopRoute = {
  route: string
  pageViews: number
  adImpressions: number
  adClicks: number
  affiliateClicks: number
  newsletterSignups: number
  estimatedRevenue: number
}

type RevenueReport = {
  days: number
  from: string
  to: string
  totals: {
    pageViews: number
    adImpressions: number
    adClicks: number
    affiliateClicks: number
    newsletterSignups: number
    adCtr: number
    affiliateCtr: number
    newsletterCvr: number
    estimatedAdRevenue: number
    estimatedAffiliateRevenue: number
    estimatedLeadValue: number
    estimatedTotalRevenue: number
  }
  topRoutes: TopRoute[]
  topSources: Array<{ source: string; count: number }>
  topCampaigns: Array<{ campaign: string; count: number }>
}

function currency(v: number) {
  return `${v.toFixed(2)} EUR`
}

export default function AdminReportsRevenuePage() {
  const [days, setDays] = useState(30)
  const [report, setReport] = useState<RevenueReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [notifyState, setNotifyState] = useState<string | null>(null)
  const [alertState, setAlertState] = useState<string | null>(null)

  async function load(currentDays: number) {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/revenue?days=${currentDays}`)
      const json = await res.json()
      setReport(json)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(days)
  }, [days])

  const topSources = useMemo(() => report?.topSources || [], [report])
  const topCampaigns = useMemo(() => report?.topCampaigns || [], [report])

  async function triggerEmail() {
    setNotifyState('Trimitere in curs...')
    const res = await fetch('/api/reports/revenue/notify', { method: 'POST' })
    const json = await res.json()
    if (res.ok) setNotifyState(`Trimis: ${json.sentTo}`)
    else setNotifyState(json.error || 'Eroare trimitere')
  }

  async function checkAlerts() {
    setAlertState('Verificare in curs...')
    const res = await fetch('/api/reports/revenue/alerts', { method: 'POST' })
    const json = await res.json()
    if (!res.ok) {
      setAlertState(json.error || 'Eroare verificare alerte')
      return
    }
    if (json.triggered) {
      setAlertState(`Alerte active: ${json.alerts.length}. Email trimis.`)
    } else {
      setAlertState('Nu exista alerte active pentru perioada curenta.')
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-white">Revenue Reports</h1>
        <div className="flex items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded border border-slate-700 bg-[#0f172a] px-3 py-2 text-slate-100"
          >
            <option value={7}>Ultimele 7 zile</option>
            <option value={30}>Ultimele 30 zile</option>
            <option value={90}>Ultimele 90 zile</option>
          </select>
          <button onClick={() => void load(days)} className="rounded bg-[#8b5cf6] px-4 py-2 text-white">Refresh</button>
        </div>
      </div>

      {loading && <div className="text-slate-300">Se incarca raportul...</div>}

      {report && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
            <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4"><div className="text-xs text-slate-400">PageViews</div><div className="text-2xl font-semibold text-white">{report.totals.pageViews}</div></div>
            <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4"><div className="text-xs text-slate-400">Ad CTR</div><div className="text-2xl font-semibold text-white">{report.totals.adCtr}%</div></div>
            <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4"><div className="text-xs text-slate-400">Affiliate CTR</div><div className="text-2xl font-semibold text-white">{report.totals.affiliateCtr}%</div></div>
            <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4"><div className="text-xs text-slate-400">Signup CVR</div><div className="text-2xl font-semibold text-white">{report.totals.newsletterCvr}%</div></div>
            <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4"><div className="text-xs text-slate-400">Venit ads estimat</div><div className="text-2xl font-semibold text-white">{currency(report.totals.estimatedAdRevenue)}</div></div>
            <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4"><div className="text-xs text-slate-400">Venit total estimat</div><div className="text-2xl font-semibold text-white">{currency(report.totals.estimatedTotalRevenue)}</div></div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4">
              <h2 className="mb-3 text-lg font-semibold text-white">Top Sources</h2>
              <div className="space-y-2 text-sm text-slate-200">
                {topSources.map((item) => (
                  <div key={item.source} className="flex justify-between border-b border-slate-700 pb-2">
                    <span>{item.source}</span>
                    <span>{item.count}</span>
                  </div>
                ))}
                {topSources.length === 0 && <div className="text-slate-400">Fara date.</div>}
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4">
              <h2 className="mb-3 text-lg font-semibold text-white">Top Campaigns</h2>
              <div className="space-y-2 text-sm text-slate-200">
                {topCampaigns.map((item) => (
                  <div key={item.campaign} className="flex justify-between border-b border-slate-700 pb-2">
                    <span>{item.campaign}</span>
                    <span>{item.count}</span>
                  </div>
                ))}
                {topCampaigns.length === 0 && <div className="text-slate-400">Fara date.</div>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4">
              <h2 className="mb-2 text-lg font-semibold text-white">Email report</h2>
              <p className="mb-3 text-sm text-slate-300">Trimite manual raportul de 7 zile catre adresa setata in SEO settings.</p>
              <button onClick={triggerEmail} className="rounded bg-slate-700 px-4 py-2 text-slate-100">Trimite email</button>
              {notifyState && <div className="mt-2 text-sm text-slate-300">{notifyState}</div>}
            </div>

            <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4">
              <h2 className="mb-2 text-lg font-semibold text-white">Revenue Alerts</h2>
              <p className="mb-3 text-sm text-slate-300">Verifica pragurile minime (CTR/CVR/revenue) si trimite alerta email daca sunt depasite in jos.</p>
              <button onClick={checkAlerts} className="rounded bg-amber-700 px-4 py-2 text-white">Check alerts</button>
              {alertState && <div className="mt-2 text-sm text-slate-300">{alertState}</div>}
            </div>
          </div>

          <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4">
            <h2 className="mb-3 text-lg font-semibold text-white">Top Revenue Pages</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-slate-200">
                <thead>
                  <tr className="text-left text-slate-400">
                    <th className="py-2">Route</th>
                    <th className="py-2">PV</th>
                    <th className="py-2">Ad imp</th>
                    <th className="py-2">Aff clicks</th>
                    <th className="py-2">Signups</th>
                    <th className="py-2">Venit estimat</th>
                  </tr>
                </thead>
                <tbody>
                  {report.topRoutes.map((row) => (
                    <tr key={row.route} className="border-t border-slate-700">
                      <td className="py-2">{row.route}</td>
                      <td className="py-2">{row.pageViews}</td>
                      <td className="py-2">{row.adImpressions}</td>
                      <td className="py-2">{row.affiliateClicks}</td>
                      <td className="py-2">{row.newsletterSignups}</td>
                      <td className="py-2">{currency(row.estimatedRevenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
