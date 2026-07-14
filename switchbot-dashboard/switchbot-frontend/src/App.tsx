import { useCallback, useEffect, useRef, useState } from 'react'
import Navbar from './components/Navbar'
import Controls from './components/Controls'
import StatusBar from './components/StatusBar'
import MeterPanel from './components/MeterPanel'
import StaleMetersSection from './components/StaleMetersSection'
import { backupUrl, fetchMeters, fetchStatus, triggerRefresh } from './api/client'
import { REFRESH_INTERVAL } from './constants'
import { isStaleMeter } from './utils/format'
import { useTheme } from './hooks/useTheme'
import type { Meter, StatusResponse, TimeScale } from './types'
import gridStyles from './components/MeterGrid.module.css'
import styles from './App.module.css'

export default function App() {
  const { theme, toggleTheme } = useTheme()

  const [meters, setMeters] = useState<Meter[]>([])
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [timeScale, setTimeScale] = useState<TimeScale>('day')
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)
  const refreshingRef = useRef(false)

  const loadData = useCallback(async (clearError = true) => {
    try {
      const [metersResp, statusResp] = await Promise.all([
        fetchMeters(),
        fetchStatus(),
      ])
      setMeters(metersResp.meters ?? [])
      setStatus(statusResp)
      setConnected(true)
      if (clearError) {
        setError(null)
      }
      setLastRefresh(new Date())
      setRefreshTick((tick) => tick + 1)
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
    loadDataRef.current()
    const id = window.setInterval(() => {
      if (!refreshingRef.current) {
        loadDataRef.current()
      }
    }, REFRESH_INTERVAL)
    return () => window.clearInterval(id)
  }, [])

  const handleRefresh = useCallback(async () => {
    refreshingRef.current = true
    setRefreshing(true)
    let refreshError: string | null = null
    try {
      await triggerRefresh()
    } catch (err) {
      refreshError = err instanceof Error ? err.message : String(err)
    } finally {
      await loadData(refreshError === null)
      if (refreshError) {
        setError(refreshError)
      }
      refreshingRef.current = false
      setRefreshing(false)
    }
  }, [loadData])

  const handleBackup = useCallback(() => {
    window.open(backupUrl(), '_blank')
  }, [])

  const activeMeters = meters.filter((m) => !isStaleMeter(m))
  const staleMeters = meters.filter((m) => isStaleMeter(m))

  return (
    <>
      <Navbar connected={connected} theme={theme} onToggleTheme={toggleTheme} />
      <main className={styles.container}>
        <Controls
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          onRefresh={handleRefresh}
          onBackup={handleBackup}
          refreshing={refreshing}
        />

        <StatusBar status={status} lastRefresh={lastRefresh} error={error} />

        {loading ? (
          <div className={styles.loading}>Loading temperature data...</div>
        ) : (
          <>
            {activeMeters.length > 0 && (
              <div className={gridStyles.grid}>
                {activeMeters.map((meter) => (
                  <MeterPanel
                    key={meter.device_id}
                    meter={meter}
                    timeScale={timeScale}
                    refreshTick={refreshTick}
                  />
                ))}
              </div>
            )}

            {staleMeters.length > 0 && (
              <StaleMetersSection
                meters={staleMeters}
                timeScale={timeScale}
                refreshTick={refreshTick}
              />
            )}
          </>
        )}

        <footer className={styles.footer}>
          Temp Master Dashboard v1.0 — Built with React + Vite + Recharts
        </footer>
      </main>
    </>
  )
}
