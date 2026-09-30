import { useState } from 'react'
import Controls from './components/Controls'
import ErrorAlert from './components/ErrorAlert'
import Footer from './components/Footer'
import MeterGrid from './components/MeterGrid'
import Navbar from './components/Navbar'
import RateLimitWarning from './components/RateLimitWarning'
import StaleMetersSection from './components/StaleMetersSection'
import StatusBar from './components/StatusBar'
import { useDashboardData } from './hooks/useDashboardData'
import { ThemeProvider } from './hooks/ThemeProvider'
import { backupUrl, triggerRefresh } from './lib/api'
import { splitMeters } from './lib/meters'
import type { TimeScale } from './types'

function Dashboard() {
  const { meters, status, loading, error, lastRefresh, reloadToken, reload } = useDashboardData()
  const [timeScale, setTimeScale] = useState<TimeScale>('day')
  const [refreshing, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const { activeMeters, staleMeters } = splitMeters(meters)

  const handleRefresh = async () => {
    setRefreshError(null)
    setRefreshing(true)
    try {
      await triggerRefresh()
    } catch (cause) {
      setRefreshError(`Failed to refresh: ${cause instanceof Error ? cause.message : String(cause)}`)
    } finally {
      await reload()
      setRefreshing(false)
    }
  }

  const handleBackup = () => {
    window.open(backupUrl, '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-100 pt-20 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <Navbar connected={!error} />
      <main className="mx-auto max-w-screen-2xl px-4 sm:px-6">
        <Controls
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          onRefresh={() => void handleRefresh()}
          onBackup={handleBackup}
          refreshing={refreshing}
        />
        {status && <StatusBar meterCount={status.meters_count || 0} lastRefresh={lastRefresh} />}
        {status?.is_rate_limited && <RateLimitWarning remaining={status.backoff_remaining || 0} />}
        {loading && <div data-testid="loading" className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">Loading temperature data...</div>}
        {(refreshError ?? error) && <ErrorAlert message={refreshError ?? error ?? ''} />}
        {!loading && (
          <>
            <MeterGrid meters={activeMeters} timeScale={timeScale} reloadToken={reloadToken} />
            <StaleMetersSection meters={staleMeters} timeScale={timeScale} reloadToken={reloadToken} />
          </>
        )}
        <Footer />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <Dashboard />
    </ThemeProvider>
  )
}
