import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchMeters, fetchStatus, getBackupUrl, triggerRefresh } from './api'
import { REFRESH_INTERVAL, TIME_SCALES } from './constants'
import type { Meter, StatusResponse, TimeScale } from './types'
import { isStaleMeter, pad2 } from './utils'
import MeterPanel from './components/MeterPanel'
import StaleMetersSection from './components/StaleMetersSection'

export default function App() {
  const [meters, setMeters] = useState<Meter[]>([])
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [timeScale, setTimeScale] = useState<TimeScale>('day')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)
  const requestIdRef = useRef(0)

  const showError = useCallback((message: string) => {
    setLoading(false)
    setError(message)
    setConnected(false)
  }, [])

  const loadData = useCallback(async () => {
    const id = ++requestIdRef.current
    try {
      const metersResponse = await fetchMeters()
      let statusResponse: StatusResponse
      try {
        statusResponse = await fetchStatus()
      } catch (statusError) {
        const message = statusError instanceof Error ? statusError.message : String(statusError)
        throw new Error(`status: ${message}`)
      }
      if (id !== requestIdRef.current) {
        return
      }
      setMeters(metersResponse.meters || [])
      setStatus(statusResponse)
      setConnected(true)
      setError(null)
      setLoading(false)
      setLastRefresh(new Date())
      setRefreshTick((tick) => tick + 1)
    } catch (loadError) {
      if (id !== requestIdRef.current) {
        return
      }
      const message = loadError instanceof Error ? loadError.message : String(loadError)
      const isStatusError = message.startsWith('status: ')
      showError(
        `Failed to fetch ${isStatusError ? 'status' : 'meters'}: ${
          isStatusError ? message.slice('status: '.length) : message
        }`,
      )
    }
  }, [showError])

  useEffect(() => {
    void loadData()
    const interval = window.setInterval(() => void loadData(), REFRESH_INTERVAL)
    return () => window.clearInterval(interval)
  }, [loadData])

  const handleRefresh = async () => {
    setRefreshError(null)
    setRefreshing(true)
    try {
      await triggerRefresh()
    } catch (refreshError) {
      const message = refreshError instanceof Error ? refreshError.message : String(refreshError)
      setRefreshError(`Failed to refresh: ${message}`)
    } finally {
      await loadData()
      setRefreshing(false)
    }
  }

  const activeMeters = meters.filter((meter) => !isStaleMeter(meter))
  const staleMeters = meters.filter((meter) => isStaleMeter(meter))
  const refreshTime = lastRefresh
    ? `Last refresh: ${pad2(lastRefresh.getHours())}:${pad2(lastRefresh.getMinutes())}:${pad2(
        lastRefresh.getSeconds(),
      )}`
    : ''

  return (
    <>
      <nav className="navbar navbar-default navbar-fixed-top">
        <div className="container-fluid">
          <div className="navbar-header">
            <a className="navbar-brand" href="#">
              Temp Master Dashboard
            </a>
          </div>
          <ul className="nav navbar-nav">
            <li className="active">
              <a href="/">Dashboard</a>
            </li>
          </ul>
          <div className="navbar-status pull-right">
            <span className={`label ${connected ? 'label-success' : 'label-danger'}`}>
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </nav>

      <div className="container-fluid">
        <div className="panel panel-default">
          <div className="panel-body">
            <form className="form-inline">
              <div className="form-group">
                <label htmlFor="time-scale-select">Time Range:</label>
                <select
                  id="time-scale-select"
                  className="form-control"
                  value={timeScale}
                  onChange={(event) => setTimeScale(event.target.value as TimeScale)}
                >
                  {TIME_SCALES.map((scale) => (
                    <option value={scale.value} key={scale.value}>
                      {scale.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                id="btn-refresh"
                className="btn btn-primary"
                disabled={refreshing}
                onClick={() => void handleRefresh()}
              >
                {refreshing ? 'Refreshing...' : 'Refresh Data'}
              </button>
              <button
                type="button"
                id="btn-backup"
                className="btn btn-default"
                onClick={() => window.open(getBackupUrl(), '_blank')}
              >
                Download Backup
              </button>
            </form>
          </div>
        </div>

        {status && (
          <div className="alert alert-info" id="status-bar">
            <span id="status-meters-count">
              Monitoring {status.meters_count || 0} {status.meters_count === 1 ? 'meter' : 'meters'}
            </span>
            <span className="pull-right" id="status-last-refresh">
              {refreshTime}
            </span>
          </div>
        )}

        {status?.is_rate_limited && (
          <div className="alert alert-warning" id="rate-limit-warning">
            <strong>Rate Limited.</strong>{' '}
            <span id="rate-limit-text">
              SwitchBot API rate limit reached. Retry in {status.backoff_remaining || 0} seconds.
            </span>
          </div>
        )}

        {loading && (
          <div id="loading">
            <p className="text-muted">Loading temperature data...</p>
          </div>
        )}

        {error && (
          <div className="alert alert-danger" id="error">
            <strong>Error.</strong> <span id="error-text">{error}</span>
          </div>
        )}

        {refreshError && (
          <div className="alert alert-danger" id="refresh-error">
            <strong>Error.</strong> {refreshError}
          </div>
        )}

        <div id="meters-container">
          {activeMeters.length > 0 && (
            <div className="row">
              {activeMeters.map((meter) => (
                <div className="col-md-4 col-sm-6" key={meter.device_id}>
                  <MeterPanel
                    meter={meter}
                    isStale={false}
                    timeScale={timeScale}
                    refreshTick={refreshTick}
                  />
                </div>
              ))}
            </div>
          )}
          <StaleMetersSection
            meters={staleMeters}
            timeScale={timeScale}
            refreshTick={refreshTick}
          />
        </div>

        <footer>Temp Master Dashboard v1.0 - Built with React + Vite</footer>
      </div>
    </>
  )
}
