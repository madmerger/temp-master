import { useCallback, useEffect, useMemo, useState } from 'react'
import { backupUrl, fetchMeters, fetchStatus, triggerRefresh } from './api'
import { Controls } from './components/Controls'
import { MeterGrid } from './components/MeterGrid'
import { Navbar } from './components/Navbar'
import { StaleMetersSection } from './components/StaleMetersSection'
import { StatusBar } from './components/StatusBar'
import { REFRESH_INTERVAL, isStaleMeter } from './meters'
import type { Meter, StatusResponse, TimeScale } from './types'

export default function App() {
  const [meters, setMeters] = useState<Meter[]>([])
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [timeScale, setTimeScale] = useState<TimeScale>('day')
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

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
    } catch (err) {
      setConnected(false)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    const id = setInterval(loadData, REFRESH_INTERVAL)
    return () => clearInterval(id)
  }, [loadData])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await triggerRefresh()
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh')
    } finally {
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
    <>
      <Navbar connected={connected} />
      <div className="container-fluid">
        <Controls
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          onRefresh={handleRefresh}
          onBackup={handleBackup}
          refreshing={refreshing}
        />

        <StatusBar status={status} lastRefresh={lastRefresh} />

        {error && (
          <div className="alert alert-danger">
            <span>
              <strong>Error.</strong> {error}
            </span>
          </div>
        )}

        {loading ? (
          <div id="loading">
            <p>Loading temperature data...</p>
          </div>
        ) : (
          <>
            <MeterGrid meters={activeMeters} timeScale={timeScale} />
            <StaleMetersSection meters={staleMeters} timeScale={timeScale} />
          </>
        )}

        <footer>
          Temp Master Dashboard v1.0 - Built with React + TypeScript + Vite +
          Recharts
        </footer>
      </div>
    </>
  )
}
