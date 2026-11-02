import { useMemo, useState } from 'react'
import { downloadBackup, triggerRefresh } from './api'
import { Controls } from './components/Controls'
import { MeterCard } from './components/MeterCard'
import { NavBar } from './components/NavBar'
import { RateLimitWarning } from './components/RateLimitWarning'
import { StaleMetersSection } from './components/StaleMetersSection'
import { StatusBar } from './components/StatusBar'
import { useDashboardData } from './hooks/useDashboardData'
import type { TimeScale } from './types'
import { isStaleMeter } from './utils/format'
import styles from './App.module.css'

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export default function App() {
  const {
    meters,
    status,
    loading,
    error,
    connected,
    lastRefresh,
    refreshToken,
    reload,
    setError,
  } = useDashboardData()
  const [timeScale, setTimeScale] = useState<TimeScale>('day')
  const [refreshing, setRefreshing] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const { activeMeters, staleMeters } = useMemo(() => {
    const active: typeof meters = []
    const stale: typeof meters = []
    meters.forEach((meter) => {
      if (isStaleMeter(meter)) {
        stale.push(meter)
      } else {
        active.push(meter)
      }
    })
    return { activeMeters: active, staleMeters: stale }
  }, [meters])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      try {
        await triggerRefresh()
      } catch (requestError) {
        setError(`Failed to refresh: ${errorMessage(requestError)}`)
      }
      await reload()
    } finally {
      setRefreshing(false)
    }
  }

  const handleBackup = async () => {
    setDownloading(true)
    try {
      await downloadBackup()
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
      <NavBar connected={connected} />
      <main className={styles.container}>
        <Controls
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          onRefresh={() => void handleRefresh()}
          onBackup={() => void handleBackup()}
          refreshing={refreshing}
          downloading={downloading}
        />

        {status && <StatusBar status={status} lastRefresh={lastRefresh} />}
        {status?.is_rate_limited && (
          <RateLimitWarning remaining={status.backoff_remaining || 0} />
        )}

        {loading && (
          <p className={styles.loading}>Loading temperature data...</p>
        )}

        {error && (
          <div className={styles.error} role="alert">
            <strong>Error.</strong> {error}
          </div>
        )}

        <section className={styles.meterGrid} aria-label="Meters">
          {activeMeters.map((meter) => (
            <MeterCard
              key={meter.device_id}
              meter={meter}
              isStale={false}
              timeScale={timeScale}
              refreshToken={refreshToken}
            />
          ))}
        </section>
        <StaleMetersSection
          meters={staleMeters}
          timeScale={timeScale}
          refreshToken={refreshToken}
        />

        <footer className={styles.footer}>
          Temp Master Dashboard v2.0 - Built with React + Vite
        </footer>
      </main>
    </>
  )
}
