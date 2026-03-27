'use client'

import { useEffect, useMemo, useState } from 'react'
import { BackupStatus, BackupType } from '@prisma/client'

type BackupLogDto = {
  id: string
  type: BackupType
  status: BackupStatus
  filePath: string | null
  fileSizeFormatted: string
  duration: number | null
  createdAt: string
  error: string | null
}

type SeoSettingsDto = {
  notifyEmail: string | null
  notifyOnBackup: boolean
  notifyOnErrors: boolean
}

const typeLabel: Record<BackupType, string> = {
  DATABASE: 'Database',
  MEDIA: 'Media',
  FULL: 'Full',
}

const statusColor: Record<BackupStatus, string> = {
  SUCCESS: 'bg-emerald-600',
  RUNNING: 'bg-amber-500',
  FAILED: 'bg-rose-600',
}

export default function BackupPage() {
  const [logs, setLogs] = useState<BackupLogDto[]>([])
  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState<BackupType | null>(null)
  const [tab, setTab] = useState<'logs' | 'settings'>('logs')
  const [settings, setSettings] = useState<SeoSettingsDto | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/backup/list')
    const json = await res.json()
    setLogs(Array.isArray(json.data) ? json.data : [])
    setLoading(false)
  }

  async function loadSettings() {
    const res = await fetch('/api/seo-settings')
    const json = await res.json()
    setSettings({
      notifyEmail: json.notifyEmail || '',
      notifyOnBackup: Boolean(json.notifyOnBackup),
      notifyOnErrors: Boolean(json.notifyOnErrors),
    })
  }

  useEffect(() => {
    load()
    loadSettings()
  }, [])

  const lastOfType = useMemo(() => {
    const map: Partial<Record<BackupType, BackupLogDto>> = {}
    for (const log of logs) {
      if (!map[log.type]) map[log.type] = log
    }
    return map
  }, [logs])

  async function run(type: BackupType) {
    setRunning(type)
    await fetch(`/api/backup/run?type=${type.toLowerCase()}`, {
      method: 'POST',
    })
    setRunning(null)
    load()
  }

  async function saveSettings() {
    if (!settings) return
    await fetch('/api/seo-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    await loadSettings()
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <button className={`px-4 py-2 rounded ${tab === 'logs' ? 'bg-[#8b5cf6] text-white' : 'bg-slate-700 text-slate-200'}`} onClick={() => setTab('logs')}>
          Logs
        </button>
        <button className={`px-4 py-2 rounded ${tab === 'settings' ? 'bg-[#8b5cf6] text-white' : 'bg-slate-700 text-slate-200'}`} onClick={() => setTab('settings')}>
          Settings
        </button>
      </div>

      {tab === 'logs' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['DATABASE', 'MEDIA', 'FULL'] as BackupType[]).map((type) => {
              const log = lastOfType[type]
              const color = log ? statusColor[log.status] : 'bg-slate-700'
              return (
                <div key={type} className="rounded-xl border border-slate-700 bg-[#1e293b] p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-white font-semibold">{typeLabel[type]}</div>
                    <span className={`text-xs px-2 py-1 rounded ${color} text-white`}>{log?.status || 'N/A'}</span>
                  </div>
                  <div className="text-sm text-slate-300">Ultimul: {log ? new Date(log.createdAt).toLocaleString('ro-RO') : 'N/A'}</div>
                  <div className="text-sm text-slate-300">Dimensiune: {log?.fileSizeFormatted || 'n/a'}</div>
                  <button
                    className="px-3 py-2 rounded bg-[#8b5cf6] text-white"
                    onClick={() => run(type)}
                    disabled={!!running}
                  >
                    {running === type ? 'Ruleaza...' : 'Ruleaza acum'}
                  </button>
                </div>
              )
            })}
          </div>

          <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-4 overflow-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="text-slate-400">
                <tr>
                  <th className="text-left py-2">Tip</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Fisier</th>
                  <th className="text-left py-2">Size</th>
                  <th className="text-left py-2">Durata</th>
                  <th className="text-left py-2">Data</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-4 text-slate-300">Se incarca...</td></tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-t border-slate-700">
                      <td className="py-2 text-slate-200">{typeLabel[log.type]}</td>
                      <td className="py-2"><span className={`px-2 py-1 rounded ${statusColor[log.status]} text-white`}>{log.status}</span></td>
                      <td className="py-2 text-slate-300 truncate max-w-[240px]">{log.filePath || '-'}</td>
                      <td className="py-2 text-slate-300">{log.fileSizeFormatted}</td>
                      <td className="py-2 text-slate-300">{log.duration ? `${log.duration}s` : '-'}</td>
                      <td className="py-2 text-slate-300">{new Date(log.createdAt).toLocaleString('ro-RO')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'settings' && settings && (
        <div className="rounded-xl border border-slate-700 bg-[#1e293b] p-6 space-y-4 max-w-3xl">
          <h1 className="text-xl font-semibold text-white">Backup Notifications</h1>
          <input
            value={settings.notifyEmail || ''}
            onChange={(e) => setSettings({ ...settings, notifyEmail: e.target.value })}
            placeholder="Notify email"
            className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2"
          />
          <label className="flex items-center gap-2 text-slate-200 text-sm">
            <input
              type="checkbox"
              checked={settings.notifyOnBackup}
              onChange={(e) => setSettings({ ...settings, notifyOnBackup: e.target.checked })}
            />
            Notificari backup
          </label>
          <label className="flex items-center gap-2 text-slate-200 text-sm">
            <input
              type="checkbox"
              checked={settings.notifyOnErrors}
              onChange={(e) => setSettings({ ...settings, notifyOnErrors: e.target.checked })}
            />
            Notificari erori critice
          </label>
          <button className="px-4 py-2 rounded-lg bg-[#8b5cf6] text-white" onClick={saveSettings}>Salveaza</button>
        </div>
      )}
    </section>
  )
}
