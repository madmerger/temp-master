import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { backupUrl, fetchMeters, fetchStatus, triggerRefresh } from './api'
import { Controls } from './components/Controls'
import { MeterGrid } from './components/MeterGrid'
import { Navbar } from './components/Navbar'
import { RateLimitWarning } from './components/RateLimitWarning'
import { StaleMetersSection } from './components/StaleMetersSection'
import { StatusBar } from './components/StatusBar'
import type { Meter, Status, TimeScale } from './types'
import { isStaleMeter } from './utils'

const REFRESH_INTERVAL = 30000

export function App() {
  const [meters, setMeters] = useState<Meter[]>([])
  const [status, setStatus] = useState<Status | null>(null)
  const [timeScale, setTimeScale] = useState<TimeScale>('day')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connected, setConnected] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const loadData = useCallback(async () => {
    try {
      const [metersResp, statusResp] = await Promise.all([
        fetchMeters(),
        fetchStatus(),
      ])
      setMeters(metersResp.meters ?? [])
      setStatus(statusResp)
      setConnected(true)
      setError(null)
      setLastRefresh(new Date())
      setReloadKey((k) => k + 1)
    } catch (err) {
      setConnected(false)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDataRef = useRef(loadData)
  loadDataRef.current = loadData

  useEffect(() => {
    void loadDataRef.current()
    const id = window.setInterval(() => {
      void loadDataRef.current()
    }, REFRESH_INTERVAL)
    return () => window.clearInterval(id)
  }, [])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await triggerRefresh()
    } catch (err) {
      setConnected(false)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      await loadData()
      setRefreshing(false)
    }
  }, [loadData])

  const handleBackup = useCallback(() => {
    window.open(backupUrl(), '_blank')
  }, [])

  const { activeMeters, staleMeters } = useMemo(() => {
    const active: Meter[] = []
    const stale: Meter[] = []
    for (const meter of meters) {
      if (isStaleMeter(meter)) {
        stale.push(meter)
      } else {
        active.push(meter)
      }
    }
    return { activeMeters: active, staleMeters: stale }
  }, [meters])

  return (
    <div className="app">
      <Navbar connected={connected} />
      <div className="container">
        <Controls
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          onRefresh={handleRefresh}
          onBackup={handleBackup}
          refreshing={refreshing}
        />

        <StatusBar status={status} lastRefresh={lastRefresh} />
        <RateLimitWarning status={status} />

        {error && (
          <div className="alert danger">
            <span>
              <strong>Error. </strong>
              {error}
            </span>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading temperature data...</div>
        ) : (
          <>
            <MeterGrid
              meters={activeMeters}
              timeScale={timeScale}
              reloadKey={reloadKey}
            />
            <StaleMetersSection
              meters={staleMeters}
              timeScale={timeScale}
              reloadKey={reloadKey}
            />
          </>
        )}

        <footer className="footer">
          Temp Master Dashboard v2.0 - Built with React + Vite
        </footer>
      </div>
    </div>
  )
}
