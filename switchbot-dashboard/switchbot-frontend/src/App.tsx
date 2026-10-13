import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { downloadBackup, fetchMeters, fetchStatus, triggerRefresh, ApiError } from './lib/api'
import { partitionMeters } from './lib/meters'
import { Controls } from './components/Controls'
import { ErrorAlert } from './components/ErrorAlert'
import { Loading } from './components/Loading'
import { MeterCard } from './components/MeterCard'
import { Navbar } from './components/Navbar'
import { RateLimitWarning } from './components/RateLimitWarning'
import { StaleMetersSection } from './components/StaleMetersSection'
import { StatusBar } from './components/StatusBar'
import type { TimeScale } from './types'

const REFRESH_INTERVAL = 30000

interface DashboardData {
  meters: Awaited<ReturnType<typeof fetchMeters>>
  status: Awaited<ReturnType<typeof fetchStatus>>
}

interface ActionError {
  message: string
  at: number
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export default function App() {
  const queryClient = useQueryClient()
  const [timeScale, setTimeScale] = useState<TimeScale>('day')
  const [actionError, setActionError] = useState<ActionError | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: async (): Promise<DashboardData> => {
      let meters: DashboardData['meters']
      try {
        meters = await fetchMeters()
      } catch (error) {
        throw new Error(`Failed to fetch meters: ${errorMessage(error)}`)
      }

      let status: DashboardData['status']
      try {
        status = await fetchStatus()
      } catch (error) {
        throw new Error(`Failed to fetch status: ${errorMessage(error)}`)
      }
      return { meters, status }
    },
    refetchInterval: REFRESH_INTERVAL,
    retry: false,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (actionError && dashboardQuery.dataUpdatedAt > actionError.at) {
      setActionError(null)
    }
  }, [actionError, dashboardQuery.dataUpdatedAt])

  const queryError = dashboardQuery.error ? errorMessage(dashboardQuery.error) : null
  const displayedError = actionError?.message ?? queryError
  const connected = !dashboardQuery.isError && !actionError
  const { active, stale } = partitionMeters(dashboardQuery.data?.meters.meters ?? [])
  const status = dashboardQuery.data?.status

  async function handleRefresh() {
    setRefreshing(true)
    let refreshError: unknown = null
    try {
      await triggerRefresh()
    } catch (error) {
      refreshError = error
    }
    await queryClient.invalidateQueries()
    setRefreshing(false)
    if (refreshError) {
      setActionError({ message: `Failed to refresh: ${errorMessage(refreshError)}`, at: Date.now() })
    }
  }

  async function handleDownloadBackup() {
    setDownloading(true)
    try {
      const { blob, filename } = await downloadBackup()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      const message =
        error instanceof ApiError
          ? `Failed to download backup (HTTP ${error.status}).${error.requestId ? ` Request ID: ${error.requestId}` : ''}`
          : `Failed to download backup: ${errorMessage(error)}`
      setActionError({ message, at: Date.now() })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
      <Navbar connected={connected} />
      <main className="container-fluid">
        <Controls
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          onRefresh={() => void handleRefresh()}
          onDownloadBackup={() => void handleDownloadBackup()}
          refreshing={refreshing}
          downloading={downloading}
        />

        {status && <StatusBar status={status} dataUpdatedAt={dashboardQuery.dataUpdatedAt} />}
        {status && <RateLimitWarning status={status} />}
        {!dashboardQuery.data && !displayedError && <Loading />}
        {displayedError && <ErrorAlert message={displayedError} />}

        <div className="meter-grid">
          {active.map((meter) => (
            <MeterCard key={meter.device_id} meter={meter} isStale={false} timeScale={timeScale} />
          ))}
        </div>
        <StaleMetersSection meters={stale} timeScale={timeScale} />

        <footer>Temp Master Dashboard v2.0 - Built with React + TypeScript + Vite</footer>
      </main>
    </>
  )
}
