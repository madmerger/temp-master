import { useCallback, useEffect, useState } from 'react'
import { backupUrl, fetchMeters, fetchStatus, triggerRefresh } from './api'
import MeterCard from './components/MeterCard'
import ThemeSwitcher from './components/ThemeSwitcher'
import type { MeterDevice, StatusResponse, TimeScale } from './types'
import { formatClock, isStaleMeter } from './utils'

const REFRESH_INTERVAL = 30000

const TIME_SCALE_OPTIONS: { value: TimeScale; label: string }[] = [
  { value: 'hour', label: 'Last Hour' },
  { value: 'day', label: 'Last 24 Hours' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'year', label: 'Last Year' },
]

export default function App() {
  const [meters, setMeters] = useState<MeterDevice[]>([])
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [timeScale, setTimeScale] = useState<TimeScale>('day')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<string>('')
  const [reloadToken, setReloadToken] = useState(0)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [metersResp, statusResp] = await Promise.all([fetchMeters(), fetchStatus()])
      setMeters(metersResp.meters ?? [])
      setStatus(statusResp)
      setConnected(true)
      setError(null)
      setLoading(false)
      setLastRefresh(formatClock(new Date()))
      setReloadToken((t) => t + 1)
    } catch (err) {
      setLoading(false)
      setConnected(false)
      setError('Failed to fetch data: ' + (err instanceof Error ? err.message : String(err)))
    }
  }, [])

  useEffect(() => {
    // loadData is stable (empty deps), so the interval always calls the latest one.
    void loadData()
    const id = window.setInterval(() => void loadData(), REFRESH_INTERVAL)
    return () => window.clearInterval(id)
  }, [loadData])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await triggerRefresh()
      await loadData()
    } catch (err) {
      setError('Failed to refresh: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setRefreshing(false)
    }
  }

  const handleBackup = () => {
    window.open(backupUrl(), '_blank')
  }

  const meterCount = status?.meters_count ?? 0
  const meterNoun = meterCount === 1 ? 'meter' : 'meters'

  const activeMeters: MeterDevice[] = []
  const staleMeters: MeterDevice[] = []
  for (const meter of meters) {
    if (isStaleMeter(meter)) staleMeters.push(meter)
    else activeMeters.push(meter)
  }

  return (
    <>
      <nav className="navbar">
        <span className="navbar-brand">Temp Master Dashboard</span>
        <div className="navbar-right">
          <ThemeSwitcher />
          <span className={connected ? 'badge badge-connected' : 'badge badge-disconnected'}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </nav>

      <div className="container">
        <div className="panel">
          <div className="panel-body">
            <div className="controls">
              <div className="control-group">
                <label htmlFor="time-scale-select">Time Range:</label>
                <select
                  id="time-scale-select"
                  className="form-control"
                  value={timeScale}
                  onChange={(e) => setTimeScale(e.target.value as TimeScale)}
                >
                  {TIME_SCALE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? 'Refreshing...' : 'Refresh Data'}
              </button>
              <button type="button" className="btn" onClick={handleBackup}>
                Download Backup
              </button>
            </div>
          </div>
        </div>

        {status && (
          <div className="alert alert-info">
            <span>
              Monitoring {meterCount} {meterNoun}
            </span>
            {lastRefresh && <span>Last refresh: {lastRefresh}</span>}
          </div>
        )}

        {status?.is_rate_limited && (
          <div className="alert alert-warning">
            <strong>Rate Limited.</strong> SwitchBot API rate limit reached. Retry in{' '}
            {status.backoff_remaining} seconds.
          </div>
        )}

        {loading && (
          <div className="loading">
            <p>Loading temperature data...</p>
          </div>
        )}

        {error && (
          <div className="alert alert-danger">
            <strong>Error.</strong> {error}
          </div>
        )}

        {!loading && (
          <>
            {activeMeters.length > 0 && (
              <div className="meters-grid">
                {activeMeters.map((meter) => (
                  <MeterCard
                    key={meter.device_id}
                    meter={meter}
                    timeScale={timeScale}
                    reloadToken={reloadToken}
                  />
                ))}
              </div>
            )}

            {staleMeters.length > 0 && (
              <section className="meter-section stale-meters-section">
                <div className="meter-section-header">
                  <h3 className="meter-section-title">⚠ 未更新のメーター</h3>
                  <p className="meter-section-subtitle">1週間以上更新されていないデバイス</p>
                </div>
                <div className="meters-grid">
                  {staleMeters.map((meter) => (
                    <MeterCard
                      key={meter.device_id}
                      meter={meter}
                      timeScale={timeScale}
                      reloadToken={reloadToken}
                      isStale
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <footer>Temp Master Dashboard v1.0 - Built with React + Vite + TypeScript</footer>
      </div>
    </>
  )
}
