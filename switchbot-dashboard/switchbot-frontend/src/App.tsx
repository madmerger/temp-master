import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchMeters, fetchStatus, triggerRefresh } from './api/client'
import type { TimeScale } from './api/types'
import { isStaleMeter } from './utils/meter'
import { Controls } from './components/Controls'
import { MeterGrid } from './components/MeterGrid'
import { RateLimitWarning } from './components/RateLimitWarning'
import { StaleMetersSection } from './components/StaleMetersSection'
import { StatusBar } from './components/StatusBar'
import { ThemeSwitcher } from './components/ThemeSwitcher'

export default function App() {
  const [timeScale, setTimeScale] = useState<TimeScale>('day')
  const [refreshing, setRefreshing] = useState(false)
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const meters = useQuery({
    queryKey: ['meters'],
    queryFn: fetchMeters,
    refetchInterval: 30_000,
  })
  const status = useQuery({
    queryKey: ['status'],
    queryFn: fetchStatus,
    refetchInterval: 30_000,
  })

  useEffect(() => {
    if (meters.data && status.data) {
      setRefreshedAt(new Date())
      setRefreshError(null)
    }
  }, [meters.data, meters.dataUpdatedAt, status.data, status.dataUpdatedAt])

  const [activeMeters, staleMeters] = useMemo(() => {
    const all = meters.data?.meters || []
    return [
      all.filter((meter) => !isStaleMeter(meter)),
      all.filter((meter) => isStaleMeter(meter)),
    ]
  }, [meters.data])

  const refresh = async () => {
    setRefreshing(true)
    setRefreshError(null)
    try {
      await triggerRefresh()
      await queryClient.invalidateQueries({ queryKey: ['meters'] })
      await queryClient.invalidateQueries({ queryKey: ['status'] })
      await queryClient.invalidateQueries({ queryKey: ['history'] })
    } catch (error) {
      setRefreshError(
        `Failed to refresh: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    } finally {
      setRefreshing(false)
    }
  }

  const connectionError = meters.error || status.error
  const error = connectionError || refreshError

  return (
    <div className="min-h-screen bg-surface text-ink">
      <header className="flex flex-col items-start justify-between gap-6 bg-header px-[clamp(20px,5vw,72px)] py-7 text-white sm:flex-row sm:items-center">
        <div>
          <p className="m-0 text-[.7rem] font-bold tracking-[.14em] text-accent">
            ENVIRONMENTAL MONITORING
          </p>
          <h1 className="m-0 mt-1 text-[clamp(1.5rem,3vw,2.2rem)] font-bold tracking-[-.03em]">
            Temp Master Dashboard
          </h1>
        </div>
        <div className="flex w-full items-center justify-between gap-3 sm:w-auto">
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              connectionError
                ? 'bg-[#64251f] text-[#ffd1cd]'
                : 'bg-[#174b32] text-[#9ef0bd]'
            }`}
          >
            {connectionError ? 'Disconnected' : 'Connected'}
          </span>
          <ThemeSwitcher />
        </div>
      </header>
      <main className="mx-auto max-w-[1500px] px-[clamp(20px,5vw,72px)] py-7">
        <Controls
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          onRefresh={refresh}
          refreshing={refreshing}
        />
        {status.data && (
          <StatusBar status={status.data} refreshedAt={refreshedAt} />
        )}
        {status.data?.is_rate_limited && (
          <RateLimitWarning seconds={status.data.backoff_remaining || 0} />
        )}
        {error && (
          <div className="mt-4 rounded-lg bg-danger/15 px-4 py-3 text-danger">
            <strong>Error.</strong>{' '}
            {refreshError ||
              `Failed to fetch data: ${
                error instanceof Error ? error.message : 'Unknown error'
              }`}
          </div>
        )}
        {meters.isLoading ? (
          <div className="py-[70px] text-center text-muted">
            Loading temperature data...
          </div>
        ) : (
          <>
            <MeterGrid meters={activeMeters} timeScale={timeScale} />
            <StaleMetersSection meters={staleMeters} timeScale={timeScale} />
          </>
        )}
      </main>
      <footer className="p-6 text-center text-xs text-muted">
        Temp Master Dashboard v1.0
      </footer>
    </div>
  )
}
