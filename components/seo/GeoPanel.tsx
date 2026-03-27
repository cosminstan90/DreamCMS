'use client'

import { useEffect, useMemo, useState } from 'react'
import { calculateGeoScore, type GeoResult } from '@/lib/seo/geo-scorer'

type GeoPanelProps = {
  title?: string
  name?: string
  postType?: 'ARTICLE' | 'DREAM_INTERPRETATION' | 'SYMBOL'
  focusKeyword?: string
  shortDefinition?: string
  contentHtml: string
  contentJson: unknown
  authorName?: string | null
}

function gaugeColor(score: number) {
  if (score >= 75) return 'text-emerald-400'
  if (score >= 45) return 'text-amber-400'
  return 'text-rose-400'
}

function scoreColor(score: number) {
  if (score >= 75) return 'bg-emerald-500'
  if (score >= 45) return 'bg-amber-500'
  return 'bg-rose-500'
}

function badgeTone(label: string) {
  if (label.includes('Excel') || label.includes('Foarte') || label.includes('Ridic')) return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  if (label.includes('Buna') || label.includes('Med')) return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
  return 'bg-rose-500/15 text-rose-300 border-rose-500/30'
}

export function GeoPanel(props: GeoPanelProps) {
  const { title, name, postType, focusKeyword, shortDefinition, contentHtml, contentJson, authorName } = props

  const [result, setResult] = useState<GeoResult>(() =>
    calculateGeoScore(
      { title, name, postType, focusKeyword, shortDefinition, contentHtml, contentJson },
      { name: authorName || null },
    ),
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      setResult(
        calculateGeoScore(
          { title, name, postType, focusKeyword, shortDefinition, contentHtml, contentJson },
          { name: authorName || null },
        ),
      )
    }, 500)

    return () => clearTimeout(timer)
  }, [authorName, contentHtml, contentJson, focusKeyword, name, postType, shortDefinition, title])

  const percent = useMemo(() => Math.max(0, Math.min(100, result.score)), [result.score])
  const strokeOffset = useMemo(() => 251 - (251 * percent) / 100, [percent])

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4">
        <h3 className="mb-3 font-semibold text-white">GEO Score</h3>
        <div className="flex items-center gap-4">
          <svg width="90" height="90" viewBox="0 0 100 100" className="shrink-0">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#334155" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="251"
              strokeDashoffset={strokeOffset}
              className={gaugeColor(percent)}
              transform="rotate(-90 50 50)"
            />
            <text x="50" y="56" textAnchor="middle" className="fill-slate-100 text-xl font-semibold">
              {percent}
            </text>
          </svg>
          <div className="space-y-2">
            <p className={`text-sm font-medium ${gaugeColor(percent)}`}>{result.aiCitability}</p>
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full border px-2 py-1 text-xs ${badgeTone(result.answerQualityLevel)}`}>Answer quality: {result.answerQualityLevel}</span>
              <span className={`rounded-full border px-2 py-1 text-xs ${badgeTone(result.citationReadiness)}`}>Citation: {result.citationReadiness}</span>
            </div>
            <p className="text-xs text-slate-400">Estimare pentru ChatGPT, Perplexity si AI Overviews</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4 space-y-2">
        <h3 className="text-white font-semibold">Factori GEO</h3>
        {result.breakdown.map((factor) => (
          <div key={factor.key} className="rounded-lg border border-slate-700 bg-[#0f172a] px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-200">{factor.label}</span>
              <span className={`text-xs ${factor.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                {factor.score}/{factor.maxScore}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800">
              <div className={`${scoreColor((factor.score / factor.maxScore) * 100)} h-1.5 rounded-full`} style={{ width: `${(factor.score / factor.maxScore) * 100}%` }} />
            </div>
            {factor.details && <div className="mt-2 text-[11px] text-slate-400">{factor.details}</div>}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-blue-700 bg-blue-950/30 p-4 space-y-2">
        <h3 className="font-semibold text-blue-200">Raspuns direct pentru ChatGPT/Perplexity/Google AI</h3>
        <p className="text-sm text-blue-100">
          {result.directAnswer || 'Nu a fost detectat un raspuns direct suficient de clar.'}
        </p>
        {result.llmSummary && (
          <div className="rounded-lg border border-blue-800/50 bg-blue-950/40 p-3 text-sm text-blue-100">
            <div className="mb-1 text-xs uppercase tracking-wide text-blue-300">LLM Summary</div>
            {result.llmSummary}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4 space-y-2">
        <h3 className="text-white font-semibold">Snippet Candidates</h3>
        {result.snippetCandidates.length ? (
          <div className="space-y-2">
            {result.snippetCandidates.map((candidate) => (
              <div key={`${candidate.source}-${candidate.label}`} className="rounded-lg border border-slate-700 bg-[#0f172a] p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-medium text-slate-200">{candidate.label}</div>
                  <div className="text-[11px] text-violet-300">score {candidate.score}</div>
                </div>
                <div className="mt-2 text-sm text-slate-300">{candidate.text}</div>
                <div className="mt-2 text-[11px] uppercase tracking-wide text-slate-500">{candidate.source}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">Nu exista snippets suficient de puternice inca.</p>
        )}
      </div>

      <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4 space-y-2">
        <h3 className="text-white font-semibold">Speakable Sections</h3>
        {result.speakableSections.length ? (
          <ul className="space-y-1">
            {result.speakableSections.map((section) => (
              <li key={section} className="text-xs text-slate-300">
                {section}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-400">Nu exista sectiuni speakable detectate.</p>
        )}
      </div>

      <div className="rounded-xl border border-amber-700/50 bg-amber-950/20 p-4 space-y-2">
        <h3 className="text-amber-200 font-semibold">Warnings</h3>
        {result.warnings.length ? (
          <ul className="space-y-1">
            {result.warnings.map((warning) => (
              <li key={warning} className="text-xs text-amber-300">{warning}</li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-emerald-300">Nu exista warning-uri GEO majore pentru structura actuala.</p>
        )}
      </div>

      <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4 space-y-2">
        <h3 className="text-white font-semibold">Recomandari oneirice</h3>
        {result.suggestions.length ? (
          <ul className="space-y-1">
            {result.suggestions.map((tip) => (
              <li key={tip} className="text-xs text-amber-300">
                {tip}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-emerald-300">Structura este bine optimizata pentru GEO/AEO.</p>
        )}
      </div>
    </div>
  )
}
