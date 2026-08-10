import { useMemo, useState } from 'react'
import { useMeters } from './hooks/useMeters'
import { useStatus } from './hooks/useStatus'
import { useTheme } from './hooks/useTheme'
import { queryClient } from './queryClient'
import { API_URL, refreshMeters } from './api/client'
import { METERS_KEY } from './hooks/useMeters'
import { STATUS_KEY } from './hooks/useStatus'
import Navbar from './components/Navbar'
import Controls from './components/Controls'
import StatusBar from './components/StatusBar'
import RateLimitWarning from './components/RateLimitWarning'
import MeterGrid from './components/MeterGrid'
import StaleMetersSection from './components/StaleMetersSection'
import { isStaleMeter } from './utils/isStale'
import type { MeterDevice, TimeScale } from './api/types'

const EMPTY_METERS: MeterDevice[] = []

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

function getConnectionStatus(
  isLoading: boolean,
  isError: boolean,
): ConnectionStatus {
  if (isError) {
    return 'disconnected'
  }
  if (isLoading) {
    return 'connecting'
  }
  return 'connected'
}

function App() {
  const [timeScale, setTimeScale] = useState<TimeScale>('day')
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)

  const { theme, toggle } = useTheme()
  const {
    data: metersData,
    isLoading: metersLoading,
    isError: metersError,
    dataUpdatedAt: metersUpdatedAt,
  } = useMeters()
  const {
    data: statusData,
    isLoading: statusLoading,
    isError: statusError,
    dataUpdatedAt: statusUpdatedAt,
  } = useStatus()

  const meters = metersData?.meters ?? EMPTY_METERS
  const activeMeters = useMemo(
    () => meters.filter((m) => !isStaleMeter(m)),
    [meters],
  )
  const staleMeters = useMemo(
    () => meters.filter((m) => isStaleMeter(m)),
    [meters],
  )

  const lastRefresh = useMemo(() => {
    const latest = Math.max(metersUpdatedAt, statusUpdatedAt)
    return latest > 0 ? new Date(latest) : undefined
  }, [metersUpdatedAt, statusUpdatedAt])

  const connectionStatus: ConnectionStatus = useMemo(() => {
    const metersStatus = getConnectionStatus(metersLoading, metersError)
    const statusStatus = getConnectionStatus(statusLoading, statusError)
    if (metersStatus === 'disconnected' || statusStatus === 'disconnected') {
      return 'disconnected'
    }
    if (metersStatus === 'connecting' || statusStatus === 'connecting') {
      return 'connecting'
    }
    return 'connected'
  }, [metersLoading, metersError, statusLoading, statusError])

  const handleRefresh = async () => {
    setRefreshing(true)
    setRefreshError(null)
    try {
      await refreshMeters()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to refresh data'
      setRefreshError(`Failed to refresh: ${message}`)
    }

    // Trigger refetches without awaiting them so the refresh button re-enables quickly.
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: METERS_KEY }),
      queryClient.invalidateQueries({ queryKey: STATUS_KEY }),
      queryClient.invalidateQueries({ queryKey: ['history'] }),
    ])
    setRefreshing(false)
  }

  const handleBackup = () => {
    window.open(`${API_URL}/api/backup`, '_blank')
  }

  const isLoading = metersLoading || statusLoading
  const hasData = metersData && statusData

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Navbar connectionStatus={connectionStatus} theme={theme} toggle={toggle} />

      <main className="max-w-7xl mx-auto px-4 pt-24 pb-8">
        <Controls
          timeScale={timeScale}
          onChange={setTimeScale}
          onRefresh={handleRefresh}
          onBackup={handleBackup}
          refreshing={refreshing}
        />

        {isLoading && !hasData && (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            Loading temperature data...
          </div>
        )}

        {((metersError && !metersData) || (statusError && !statusData)) && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-900 dark:text-red-100 px-4 py-3 rounded mb-4">
            <strong>Error.</strong> <span>Failed to fetch data.</span>
          </div>
        )}

        {refreshError && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-900 dark:text-red-100 px-4 py-3 rounded mb-4">
            <strong>Error.</strong> <span>{refreshError}</span>
          </div>
        )}

        {statusData && <StatusBar count={statusData.meters_count} lastRefresh={lastRefresh} />}

        {statusData?.is_rate_limited && (
          <RateLimitWarning remaining={statusData.backoff_remaining} />
        )}

        {metersData && (
          <>
            <MeterGrid meters={activeMeters} timeScale={timeScale} />
            <StaleMetersSection meters={staleMeters} timeScale={timeScale} />
          </>
        )}

        <footer className="text-center text-xs text-gray-500 dark:text-gray-400 mt-10">
          Temp Master Dashboard v1.0 - Built with React + Vite + Tailwind CSS
        </footer>
      </main>
    </div>
  )
}

export default App
