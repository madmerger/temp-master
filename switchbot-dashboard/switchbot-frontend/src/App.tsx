import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchHistory, fetchMeters, fetchStatus, triggerRefresh, API_URL } from './api'
import { MeterCard } from './components/MeterCard'
import type { MeterDevice, MeterReading, StatusResponse, TimeScale } from './types'

const REFRESH_INTERVAL = 30000
const STALE_METER_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000

const DISPLAY_NAMES: Record<string, string> = {
  'Bedroom Meter': '第1蒸留塔 (T-101)', 'Living Meter': '第2蒸留塔 (T-102)', '2世': '反応器 (R-201)',
  '夢男': '熱交換器 (E-301)', '夢': '熱交換器 (E-302)', 'アワコ': '冷却塔 (CT-401)', 'ジャガ百万石': '加熱炉 (H-501)',
  'ネズミ': 'コンプレッサー (C-601)', 'バロン': '遠心分離機 (S-701)', 'ゴンタ': '混合槽 (M-801)', '蛇棚': '貯蔵タンク (TK-901)',
  '中華棚': '貯蔵タンク (TK-902)', 'へておケージ': '配管ライン (PL-1001)', '外': '屋外モニター (EM-1101)',
  'インキュベーター': '乾燥機 (D-1201)', 'ビアク': '吸収塔 (A-1301)', 'ブロッチ Hot Spot': 'フレアスタック (FS-1401)', 'マダラアオジタ': 'ボイラー (B-1501)',
}

const getDisplayName = (name: string) => DISPLAY_NAMES[name] || name
const isStaleMeter = (meter: MeterDevice) => {
  if (!meter.last_updated) return true
  const time = new Date(meter.last_updated).getTime()
  return Number.isNaN(time) || Date.now() - time >= STALE_METER_THRESHOLD_MS
}

function App() {
  const [meters, setMeters] = useState<MeterDevice[]>([])
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [histories, setHistories] = useState<Record<string, MeterReading[]>>({})
  const [historyLoading, setHistoryLoading] = useState(true)
  const [timeScale, setTimeScale] = useState<TimeScale>('day')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('temp-master-dark-mode')
    return saved === null ? window.matchMedia('(prefers-color-scheme: dark)').matches : saved === 'true'
  })

  const historyRequestId = useRef(0)
  const loadData = useCallback(async () => {
    const requestId = ++historyRequestId.current
    try {
      const [metersResponse, statusResponse] = await Promise.all([fetchMeters(), fetchStatus()])
      if (requestId !== historyRequestId.current) return
      setMeters(metersResponse.meters)
      setStatus(statusResponse)
      setLastRefresh(new Date())
      setError(null)
      setLoading(false)
      const activeMeters = metersResponse.meters.filter((meter) => !isStaleMeter(meter))
      const results = await Promise.all(activeMeters.map(async (meter) => {
        try { return [meter.device_id, (await fetchHistory(meter.device_id, timeScale)).history] as const }
        catch { return null }
      }))
      if (requestId !== historyRequestId.current) return
      const activeDeviceIds = new Set(activeMeters.map((meter) => meter.device_id))
      setHistories((currentHistories) => {
        const nextHistories: Record<string, MeterReading[]> = {}
        for (const [deviceId, history] of Object.entries(currentHistories)) {
          if (activeDeviceIds.has(deviceId)) nextHistories[deviceId] = history
        }
        for (const result of results) {
          if (result) nextHistories[result[0]] = result[1]
        }
        return nextHistories
      })
      setHistoryLoading(false)
    } catch (cause) {
      if (requestId !== historyRequestId.current) return
      setLoading(false)
      setHistoryLoading(false)
      setError(cause instanceof Error ? cause.message : 'Failed to fetch data.')
    }
  }, [timeScale])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])
  useEffect(() => {
    void loadData()
    const interval = window.setInterval(() => void loadData(), REFRESH_INTERVAL)
    return () => window.clearInterval(interval)
  }, [loadData])

  const decoratedMeters = useMemo(() => meters.map((meter) => ({ ...meter, displayName: getDisplayName(meter.device_name), stale: isStaleMeter(meter) })), [meters])
  const activeMeters = decoratedMeters.filter((meter) => !meter.stale)
  const staleMeters = decoratedMeters.filter((meter) => meter.stale)
  const handleRefresh = async () => {
    setRefreshing(true)
    try { await triggerRefresh() }
    catch (cause) { setError(`Failed to refresh: ${cause instanceof Error ? cause.message : 'Unknown error'}`) }
    finally {
      await loadData()
      setRefreshing(false)
    }
  }
  const handleThemeToggle = () => {
    const nextDarkMode = !darkMode
    setDarkMode(nextDarkMode)
    localStorage.setItem('temp-master-dark-mode', String(nextDarkMode))
  }
  const handleTimeScaleChange = (nextTimeScale: TimeScale) => {
    historyRequestId.current += 1
    setHistories({})
    setHistoryLoading(true)
    setTimeScale(nextTimeScale)
  }
  const refreshTime = lastRefresh?.toLocaleTimeString([], { hour12: false }) || ''

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6"><a href="/" className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Temp Master Dashboard</a><span className="hidden text-sm font-medium text-cyan-600 sm:inline dark:text-cyan-400">Dashboard</span></div>
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${error ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'}`}><span className={`h-2 w-2 rounded-full ${error ? 'bg-red-500' : 'bg-emerald-500'}`} />{error ? 'Disconnected' : 'Connected'}</span>
            <button type="button" onClick={handleThemeToggle} className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800" aria-label="Toggle dark mode">{darkMode ? '☀' : '☾'}</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1600px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <label className="flex flex-1 flex-col gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">Time Range
              <select value={timeScale} onChange={(event) => handleTimeScaleChange(event.target.value as TimeScale)} className="max-w-xs rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-cyan-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
                <option value="hour">Last Hour</option><option value="day">Last 24 Hours</option><option value="week">Last 7 Days</option><option value="month">Last 30 Days</option><option value="year">Last Year</option>
              </select>
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void handleRefresh()} disabled={refreshing} className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60">{refreshing ? 'Refreshing...' : 'Refresh Data'}</button>
              <button type="button" onClick={() => window.open(`${API_URL}/api/backup`, '_blank')} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">Download Backup</button>
            </div>
          </div>
        </section>
        {status && <div className="flex flex-col gap-1 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900 sm:flex-row sm:items-center sm:justify-between dark:border-cyan-900/60 dark:bg-cyan-950/40 dark:text-cyan-100"><span>Monitoring {status.meters_count} {status.meters_count === 1 ? 'meter' : 'meters'}</span>{refreshTime && <span>Last refresh: {refreshTime}</span>}</div>}
        {status?.is_rate_limited && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-100"><strong>Rate Limited.</strong> SwitchBot API rate limit reached. Retry in {status.backoff_remaining} seconds.</div>}
        {loading && <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">Loading temperature data...</div>}
        {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200"><strong>Error.</strong> {error}</div>}
        {!loading && activeMeters.length > 0 && <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{activeMeters.map((meter) => <MeterCard key={meter.device_id} meter={meter} history={histories[meter.device_id] || []} timeScale={timeScale} darkMode={darkMode} stale={false} historyLoading={historyLoading} />)}</div>}
        {!loading && staleMeters.length > 0 && <section className="space-y-3"><div><h2 className="text-lg font-semibold text-amber-800 dark:text-amber-200">⚠ 未更新のメーター</h2><p className="mt-1 text-xs text-amber-700 dark:text-amber-300">1週間以上更新されていないデバイス</p></div><div className="grid gap-5 rounded-2xl border border-amber-300 bg-amber-50/50 p-5 sm:grid-cols-2 lg:grid-cols-3 dark:border-amber-800/70 dark:bg-amber-950/20">{staleMeters.map((meter) => <MeterCard key={meter.device_id} meter={meter} history={[]} timeScale={timeScale} darkMode={darkMode} stale historyLoading={false} />)}</div></section>}
      </main>
      <footer className="px-4 pb-8 text-center text-xs text-slate-400 dark:text-slate-500">Temp Master Dashboard v1.0</footer>
    </div>
  )
}

export default App
