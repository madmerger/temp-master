import { useCallback, useState } from 'react'
import { Controls } from './components/Controls'
import { MeterPanel } from './components/MeterPanel'
import { Navbar } from './components/Navbar'
import { StaleMetersSection } from './components/StaleMetersSection'
import { backupUrl, triggerRefresh } from './lib/api'
import { useDashboardData } from './lib/useDashboardData'
import type { TimeScale } from './types'

export default function App() {
  const [timeScale, setTimeScale] = useState<TimeScale>('day')
  const [refreshing, setRefreshing] = useState(false)
  const { activeMeters, staleMeters, status, histories, loading, error, lastRefresh, reload } =
    useDashboardData(timeScale)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await triggerRefresh()
    } catch {
      // リフレッシュ要求が失敗しても最新データの再取得は試みる
    }
    await reload()
    setRefreshing(false)
  }, [reload])

  const metersCount = status?.meters_count ?? 0
  const countNoun = metersCount === 1 ? 'meter' : 'meters'

  return (
    <div className="min-h-screen bg-slate-100 pt-[70px] text-slate-800 dark:bg-slate-950 dark:text-slate-200">
      <Navbar connected={!error} />

      <div className="px-4 pb-6">
        <Controls
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          onRefresh={() => void handleRefresh()}
          onBackup={() => window.open(backupUrl(), '_blank')}
          refreshing={refreshing}
        />

        {status && (
          <div className="mb-4 flex flex-wrap justify-between gap-2 rounded border border-sky-300 bg-sky-50 px-4 py-3 text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200">
            <span>
              Monitoring {metersCount} {countNoun}
            </span>
            {lastRefresh && <span>Last refresh: {lastRefresh.toLocaleTimeString()}</span>}
          </div>
        )}

        {status?.is_rate_limited && (
          <div className="mb-4 rounded border border-amber-400 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
            <strong>Rate Limited.</strong>{' '}
            <span>
              SwitchBot API rate limit reached. Retry in {status.backoff_remaining ?? 0} seconds.
            </span>
          </div>
        )}

        {loading && (
          <div className="py-10 text-center text-slate-500 dark:text-slate-400">
            Loading temperature data...
          </div>
        )}

        {error && (
          <div className="mb-4 rounded border border-red-400 bg-red-50 px-4 py-3 text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
            <strong>Error.</strong> <span>{error}</span>
          </div>
        )}

        {activeMeters.length > 0 && (
          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeMeters.map((meter) => (
              <MeterPanel
                key={meter.device_id}
                meter={meter}
                isStale={false}
                history={histories[meter.device_id] ?? []}
                timeScale={timeScale}
              />
            ))}
          </div>
        )}

        {staleMeters.length > 0 && (
          <StaleMetersSection meters={staleMeters} timeScale={timeScale} />
        )}

        <footer className="my-8 text-center text-xs text-slate-500 dark:text-slate-400">
          Temp Master Dashboard v1.0 - Built with React + TypeScript + Vite
        </footer>
      </div>
    </div>
  )
}
