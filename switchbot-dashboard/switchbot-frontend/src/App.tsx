import { useCallback, useEffect, useRef, useState } from 'react'
import type { Meter, StatusResponse, TimeScale } from './api/types'
import { fetchMeters, fetchStatus, triggerRefresh, getBackupUrl } from './api/client'
import { REFRESH_INTERVAL } from './constants'
import { ThemeProvider } from './themes/ThemeContext'
import { ThemeSwitcher } from './components/ThemeSwitcher'
import { StatusBar } from './components/StatusBar'
import { TimeRangeSelector } from './components/TimeRangeSelector'
import { MeterPanel } from './components/MeterPanel'

function Dashboard() {
  const [meters, setMeters] = useState<Meter[]>([])
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [timeScale, setTimeScale] = useState<TimeScale>('day')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [metersRes, statusRes] = await Promise.all([
        fetchMeters(),
        fetchStatus(),
      ])
      setMeters(metersRes.meters)
      setStatus(statusRes)
      setConnected(true)
      setError(null)
      setLastRefresh(new Date())
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch data'
      setError(msg)
      setConnected(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    intervalRef.current = setInterval(loadData, REFRESH_INTERVAL)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [loadData])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await triggerRefresh()
      await loadData()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to refresh'
      setError(msg)
    } finally {
      setRefreshing(false)
    }
  }

  const handleBackup = () => {
    window.open(getBackupUrl(), '_blank')
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] transition-colors">
      {/* Navbar */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-nav-bg)] shadow-sm transition-colors">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-[var(--color-nav-text)]">
            Temp Master Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                connected
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 [.high-contrast_&]:bg-green-900 [.high-contrast_&]:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 [.high-contrast_&]:bg-red-900 [.high-contrast_&]:text-red-200'
              }`}
            >
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 pb-8 pt-20">
        {/* Controls */}
        <div className="mb-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm transition-colors">
          <div className="flex flex-wrap items-center gap-4">
            <TimeRangeSelector value={timeScale} onChange={setTimeScale} />
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="rounded-md bg-[var(--color-primary)] px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
            <button
              onClick={handleBackup}
              className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-1.5 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-badge-bg)]"
            >
              Download Backup
            </button>
          </div>
        </div>

        {/* Status */}
        {status && <div className="mb-4"><StatusBar status={status} lastRefresh={lastRefresh} /></div>}

        {/* Loading */}
        {loading && (
          <div className="py-10 text-center text-[var(--color-text-secondary)]">
            Loading temperature data...
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200 [.high-contrast_&]:bg-red-900 [.high-contrast_&]:text-red-100">
            <strong>Error.</strong> {error}
          </div>
        )}

        {/* Meters Grid */}
        {!loading && meters.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {meters.map((meter) => (
              <MeterPanel
                key={meter.device_id}
                meter={meter}
                timeScale={timeScale}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] py-4 text-center text-xs text-[var(--color-text-secondary)] transition-colors">
        Temp Master Dashboard v2.0 - Built with React + TypeScript + Tailwind CSS
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <Dashboard />
    </ThemeProvider>
  )
}
