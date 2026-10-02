import { useState } from 'react'
import { useMeters } from './hooks/useMeters'
import { useRefreshMeters } from './hooks/useRefreshMeters'
import { useStatus } from './hooks/useStatus'
import type { TimeScale } from './types'
import { Controls } from './components/Controls'
import { MeterCard } from './components/MeterCard'
import { Navbar } from './components/Navbar'
import { RateLimitWarning } from './components/RateLimitWarning'
import { StatusBar } from './components/StatusBar'
import { isStaleMeter } from './utils/stale'

export default function App() {
  const [timeScale, setTimeScale] = useState<TimeScale>('day')
  const metersQuery = useMeters()
  const statusQuery = useStatus()
  const refreshMutation = useRefreshMeters()

  const meters = metersQuery.data?.meters ?? []
  const activeMeters = meters.filter((meter) => !isStaleMeter(meter))
  const staleMeters = meters.filter((meter) => isStaleMeter(meter))
  const disconnected = metersQuery.isError || statusQuery.isError
  const loading =
    (!metersQuery.data || !statusQuery.data) &&
    !metersQuery.isError &&
    !statusQuery.isError

  let errorMessage: string | null = null
  if (metersQuery.isError) {
    errorMessage = `Failed to fetch meters: ${metersQuery.error.message}`
  } else if (statusQuery.isError) {
    errorMessage = `Failed to fetch status: ${statusQuery.error.message}`
  } else if (refreshMutation.isError) {
    errorMessage = `Failed to refresh: ${refreshMutation.error.message}`
  }

  return (
    <div className="min-h-screen">
      <Navbar disconnected={disconnected} />
      <main className="mx-auto max-w-screen-2xl px-4 pb-4 pt-6 sm:px-6 lg:px-8">
        <Controls
          isRefreshing={refreshMutation.isPending}
          onRefresh={() => refreshMutation.mutate()}
          onTimeScaleChange={setTimeScale}
          timeScale={timeScale}
        />

        {statusQuery.data && (
          <StatusBar
            metersCount={statusQuery.data.meters_count || 0}
            updatedAt={statusQuery.dataUpdatedAt}
          />
        )}
        {statusQuery.data && (
          <RateLimitWarning
            backoffRemaining={statusQuery.data.backoff_remaining || 0}
            isRateLimited={statusQuery.data.is_rate_limited}
          />
        )}

        {loading && (
          <p className="py-10 text-center text-gray-500">
            Loading temperature data...
          </p>
        )}
        {errorMessage && (
          <div className="mb-5 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-800" role="alert">
            <strong>Error.</strong> {errorMessage}
          </div>
        )}

        {activeMeters.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeMeters.map((meter) => (
              <MeterCard
                key={meter.device_id}
                meter={meter}
                timeScale={timeScale}
              />
            ))}
          </div>
        )}

        {staleMeters.length > 0 && (
          <section className="mt-6">
            <header className="mb-3 text-amber-800">
              <h2 className="m-0 text-lg font-semibold">
                <span aria-hidden="true" className="mr-2">⚠</span>
                未更新のメーター
              </h2>
              <p className="mt-1 text-xs">
                1週間以上更新されていないデバイス
              </p>
            </header>
            <div className="rounded border border-amber-400 bg-amber-50 p-3">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {staleMeters.map((meter) => (
                  <MeterCard
                    isStale
                    key={meter.device_id}
                    meter={meter}
                    timeScale={timeScale}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        <footer className="my-8 text-center text-xs text-gray-500">
          Temp Master Dashboard v2.0 - Built with React + Vite + Tailwind CSS
        </footer>
      </main>
    </div>
  )
}
