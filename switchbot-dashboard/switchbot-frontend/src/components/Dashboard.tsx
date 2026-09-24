import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchMeters, fetchStatus, triggerRefresh, type Meter, type Status, type TimeScale } from '../api'
import { splitMeters } from '../utils/meters'
import { Controls } from './Controls'
import { MeterCard } from './MeterCard'
import { RateLimitWarning } from './RateLimitWarning'
import { StatusBar } from './StatusBar'

export const REFRESH_INTERVAL = 30000

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

export function Dashboard() {
  const [meters, setMeters] = useState<Meter[]>([])
  const [status, setStatus] = useState<Status | null>(null)
  const [timeScale, setTimeScale] = useState<TimeScale>('day')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const requestSeq = useRef(0)

  const fetchData = useCallback(async () => {
    const seq = ++requestSeq.current
    try {
      const [metersRes, statusRes] = await Promise.all([fetchMeters(), fetchStatus()])
      if (seq !== requestSeq.current) return
      setMeters(metersRes.meters ?? [])
      setStatus(statusRes)
      setLastRefresh(new Date())
      setError(null)
      setConnected(true)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      if (seq !== requestSeq.current) return
      setError(`Failed to fetch data: ${errorMessage(err)}`)
      setConnected(false)
    } finally {
      if (seq === requestSeq.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
    const id = setInterval(() => void fetchData(), REFRESH_INTERVAL)
    return () => clearInterval(id)
  }, [fetchData])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await triggerRefresh()
      setRefreshError(null)
    } catch (err) {
      setRefreshError(`Failed to refresh: ${errorMessage(err)}`)
    }
    await fetchData()
    setRefreshing(false)
  }, [fetchData])

  const { active, stale } = useMemo(() => splitMeters(meters), [meters])

  return (
    <>
      <nav className="navbar navbar-expand navbar-light bg-light border-bottom fixed-top">
        <div className="container-fluid">
          <a className="navbar-brand" href="#">
            Temp Master Dashboard
          </a>
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <a className="nav-link active" href="/">
                Dashboard
              </a>
            </li>
          </ul>
          <span id="connection-status" className={`badge ${connected ? 'text-bg-success' : 'text-bg-danger'}`}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </nav>

      <div className="container-fluid">
        <Controls
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          onRefresh={() => void handleRefresh()}
          refreshing={refreshing}
        />

        <StatusBar status={status} lastRefresh={lastRefresh} />
        <RateLimitWarning status={status} />

        {loading && (
          <div id="loading">
            <p className="text-muted">Loading temperature data...</p>
          </div>
        )}

        {error && (
          <div className="alert alert-danger" role="alert">
            <strong>Error.</strong> {error}
          </div>
        )}

        {refreshError && (
          <div className="alert alert-danger" role="alert">
            <strong>Error.</strong> {refreshError}
          </div>
        )}

        {active.length > 0 && (
          <div className="row">
            {active.map((meter) => (
              <div key={meter.device_id} className="col-md-4 col-sm-6">
                <MeterCard meter={meter} isStale={false} timeScale={timeScale} refreshKey={refreshKey} />
              </div>
            ))}
          </div>
        )}

        {stale.length > 0 && (
          <section className="meter-section">
            <div className="meter-section-header">
              <h3 className="meter-section-title">&#9888; 未更新のメーター</h3>
              <p className="meter-section-subtitle">1週間以上更新されていないデバイス</p>
            </div>
            <div className="card stale-meters-panel">
              <div className="card-body">
                <div className="row">
                  {stale.map((meter) => (
                    <div key={meter.device_id} className="col-md-4 col-sm-6">
                      <MeterCard meter={meter} isStale timeScale={timeScale} refreshKey={refreshKey} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        <footer>Temp Master Dashboard v2.0 - Built with React + Recharts</footer>
      </div>
    </>
  )
}
