import { useCallback, useEffect, useRef, useState } from 'react'
import {
  backupUrl,
  fetchHistory,
  fetchMeters,
  fetchStatus,
  triggerRefresh,
} from './api/client'
import { Controls } from './components/Controls'
import { MeterGrid } from './components/MeterGrid'
import { Navbar } from './components/Navbar'
import { RateLimitWarning } from './components/RateLimitWarning'
import { StaleMetersSection } from './components/StaleMetersSection'
import { StatusBar } from './components/StatusBar'
import { REFRESH_INTERVAL } from './constants'
import { splitMetersByStaleness } from './utils/meters'
import type {
  MeterDevice,
  MeterReading,
  StatusResponse,
  TimeScale,
} from './types'

export function App() {
  const [meters, setMeters] = useState<MeterDevice[]>([])
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [histories, setHistories] = useState<Record<string, MeterReading[]>>({})
  const [timeScale, setTimeScale] = useState<TimeScale>('day')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const timeScaleRef = useRef(timeScale)
  timeScaleRef.current = timeScale

  const loadHistories = useCallback(
    async (activeMeters: MeterDevice[], scale: TimeScale) => {
      const results = await Promise.all(
        activeMeters.map(async (meter) => {
          try {
            const response = await fetchHistory(meter.device_id, scale)
            return [meter.device_id, response.history ?? []] as const
          } catch {
            return [meter.device_id, [] as MeterReading[]] as const
          }
        }),
      )
      if (timeScaleRef.current !== scale) {
        return
      }
      setHistories(Object.fromEntries(results))
    },
    [],
  )

  const loadData = useCallback(
    async (scale: TimeScale) => {
      try {
        const [metersResponse, statusResponse] = await Promise.all([
          fetchMeters(),
          fetchStatus(),
        ])
        const nextMeters = metersResponse.meters ?? []
        setMeters(nextMeters)
        setStatus(statusResponse)
        setError(null)
        setLoading(false)
        setLastRefresh(new Date())

        const { activeMeters } = splitMetersByStaleness(nextMeters)
        await loadHistories(activeMeters, scale)
      } catch (err) {
        setLoading(false)
        setError(
          `Failed to fetch data: ${err instanceof Error ? err.message : String(err)}`,
        )
      }
    },
    [loadHistories],
  )

  useEffect(() => {
    void loadData(timeScale)
    const timer = setInterval(() => {
      void loadData(timeScaleRef.current)
    }, REFRESH_INTERVAL)
    return () => clearInterval(timer)
  }, [loadData, timeScale])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await triggerRefresh()
    } catch (err) {
      setError(
        `Failed to refresh: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
    await loadData(timeScaleRef.current)
    setRefreshing(false)
  }, [loadData])

  const handleBackup = useCallback(() => {
    window.open(backupUrl(), '_blank')
  }, [])

  const { activeMeters, staleMeters } = splitMetersByStaleness(meters)

  return (
    <>
      <Navbar connected={error === null} />
      <div className="container-fluid">
        <Controls
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          onRefresh={() => void handleRefresh()}
          onBackup={handleBackup}
          refreshing={refreshing}
        />

        {status && <StatusBar status={status} lastRefresh={lastRefresh} />}

        {status?.is_rate_limited && (
          <RateLimitWarning backoffRemaining={status.backoff_remaining ?? 0} />
        )}

        {loading && <div className="loading">Loading temperature data...</div>}

        {error && (
          <div className="alert alert-danger">
            <strong>Error.</strong> {error}
          </div>
        )}

        <MeterGrid
          meters={activeMeters}
          histories={histories}
          timeScale={timeScale}
        />
        <StaleMetersSection meters={staleMeters} timeScale={timeScale} />

        <footer>Temp Master Dashboard v2.0 - Built with React + Vite</footer>
      </div>
    </>
  )
}
