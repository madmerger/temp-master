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
import type { TimeScale } from './api/types'

function App() {
  const [timeScale, setTimeScale] = useState<TimeScale>('day')
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | undefined>()

  const { theme, toggle } = useTheme()
  const {
    data: metersData,
    isLoading: metersLoading,
    isError: metersError,
  } = useMeters()
  const {
    data: statusData,
    isLoading: statusLoading,
    isError: statusError,
  } = useStatus()

  const meters = metersData?.meters ?? []
  const activeMeters = useMemo(
    () => meters.filter((m) => !isStaleMeter(m)),
    [meters],
  )
  const staleMeters = useMemo(
    () => meters.filter((m) => isStaleMeter(m)),
    [meters],
  )

  const connected = !metersLoading && !statusLoading && !metersError && !statusError

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshMeters()
    } catch {
      // Error handling is managed by the query error state
    } finally {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: METERS_KEY }),
        queryClient.invalidateQueries({ queryKey: STATUS_KEY }),
      ])
      setLastRefresh(new Date())
      setRefreshing(false)
    }
  }

  const handleBackup = () => {
    window.open(`${API_URL}/api/backup`, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Navbar connected={connected} theme={theme} toggle={toggle} />

      <main className="max-w-7xl mx-auto px-4 pt-24 pb-8">
        <Controls
          timeScale={timeScale}
          onChange={setTimeScale}
          onRefresh={handleRefresh}
          onBackup={handleBackup}
          refreshing={refreshing}
        />

        {metersLoading && statusLoading && !metersData && !statusData && (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            Loading temperature data...
          </div>
        )}

        {(metersError || statusError) && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-900 dark:text-red-100 px-4 py-3 rounded mb-4">
            <strong>Error.</strong> <span>Failed to fetch data.</span>
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
