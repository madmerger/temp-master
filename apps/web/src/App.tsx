import { isStaleMeter, type TimeScale } from '@temp-master/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Activity, CalendarDays, ChevronDown, Download, RefreshCw, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { api } from './api'
import { MeterCard } from './MeterCard'
import { ThemeControl } from './ThemeControl'

const RANGES: Record<TimeScale, string> = {
  hour: 'Last Hour',
  day: 'Last 24 Hours',
  week: 'Last 7 Days',
  month: 'Last 30 Days',
  year: 'Last Year',
}
const GRID = 'grid gap-4 md:grid-cols-2 xl:grid-cols-3'
const BUTTON = 'inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-60'

async function downloadBackup() {
  const { blob, filename } = await api.getBackup()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function App() {
  const [timeScale, setTimeScale] = useState<TimeScale>('day')
  const queryClient = useQueryClient()
  const meters = useQuery({
    queryKey: ['meters'],
    queryFn: ({ signal }) => api.getMeters(signal),
  })
  const status = useQuery({
    queryKey: ['status'],
    queryFn: ({ signal }) => api.getStatus(signal),
  })
  const refresh = useMutation({
    mutationFn: api.refreshMeters,
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['meters'] }),
        queryClient.invalidateQueries({ queryKey: ['status'] }),
      ])
      await queryClient.invalidateQueries({ queryKey: ['history'] })
    },
  })
  const backup = useMutation({ mutationFn: downloadBackup })

  const connectionError = meters.error
    ? `Failed to fetch meters: ${meters.error.message}`
    : status.error && `Failed to fetch status: ${status.error.message}`
  const initialLoad = !connectionError && (meters.isPending || status.isPending)
  const connection = connectionError ? 'Disconnected' : initialLoad ? 'Connecting' : 'Connected'
  const connectionColor = connectionError ? 'text-danger' : initialLoad ? 'text-muted' : 'text-ready'
  const actionError = refresh.error
    ? `Failed to refresh: ${refresh.error.message}`
    : backup.error && `Failed to download backup: ${backup.error.message}`

  const checkedAt = Math.max(meters.dataUpdatedAt, meters.errorUpdatedAt, status.dataUpdatedAt, status.errorUpdatedAt)
  const allMeters = meters.data?.meters ?? []
  const activeMeters = allMeters.filter((meter) => !isStaleMeter(meter, checkedAt))
  const staleMeters = allMeters.filter((meter) => isStaleMeter(meter, checkedAt))
  const statusData = status.data
  const lastRefresh = Math.min(meters.dataUpdatedAt, status.dataUpdatedAt)

  return (
    <>
      <nav aria-label="Dashboard" className="border-b border-line bg-surface">
        <div className="mx-auto flex min-h-16 max-w-[96rem] flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-8">
          <a href="/" className="flex items-center gap-2.5 rounded-md text-sm font-bold sm:text-base">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-white">
              <Activity aria-hidden="true" size={20} />
            </span>
            Temp Master Dashboard
          </a>
          <div className="flex items-center gap-3 sm:gap-4">
            <span role="status" className={`inline-flex items-center gap-1.5 text-xs font-semibold ${connectionColor}`}>
              <span aria-hidden="true" className="size-2 rounded-full bg-current" />
              {connection}
            </span>
            <ThemeControl />
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-[96rem] space-y-5 px-4 py-6 sm:px-8 sm:py-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
            {statusData && (
              <p className="mt-1 text-sm text-muted">
                Monitoring {statusData.meters_count} {statusData.meters_count === 1 ? 'meter' : 'meters'}
                {lastRefresh > 0 && (
                  <> <span aria-hidden="true">·</span> Last refresh: <time dateTime={new Date(lastRefresh).toISOString()}>
                    {new Date(lastRefresh).toLocaleTimeString('en-GB')}
                  </time></>
                )}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div>
              <label htmlFor="time-range" className="mb-1 block text-xs font-semibold text-muted">Time Range</label>
              <div className="relative flex items-center">
                <CalendarDays aria-hidden="true" className="pointer-events-none absolute left-3 size-4 text-muted" />
                <select
                  id="time-range"
                  className="min-h-10 cursor-pointer appearance-none rounded-lg border border-line bg-surface pl-9 pr-8 text-sm font-semibold"
                  value={timeScale}
                  onChange={(event) => setTimeScale(event.target.value as TimeScale)}
                >
                  {Object.entries(RANGES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2.5 size-4 text-muted" />
              </div>
            </div>
            <button
              type="button"
              className={`${BUTTON} border border-line bg-surface hover:border-primary hover:text-primary`}
              disabled={backup.isPending}
              onClick={() => {
                if (refresh.isError) refresh.reset()
                backup.mutate()
              }}
            >
              <Download aria-hidden="true" size={16} />
              {backup.isPending ? 'Downloading…' : 'Download Backup'}
            </button>
            <button
              type="button"
              className={`${BUTTON} bg-primary text-white hover:bg-primary-hover`}
              disabled={refresh.isPending}
              onClick={() => {
                if (backup.isError) backup.reset()
                refresh.mutate()
              }}
            >
              <RefreshCw aria-hidden="true" size={16} className={refresh.isPending ? 'motion-safe:animate-spin' : undefined} />
              {refresh.isPending ? 'Refreshing…' : 'Refresh Data'}
            </button>
          </div>
        </header>

        {statusData?.is_rate_limited && (
          <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-warning-line bg-warning-surface p-4 text-sm text-warning">
            <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <p><strong>Rate Limited.</strong> SwitchBot API rate limit reached. Retry in {statusData.backoff_remaining} seconds.</p>
          </div>
        )}

        {(connectionError || actionError) && (
          <div role="alert" className="rounded-xl border border-danger/30 bg-danger-surface p-4 text-sm text-danger">
            {connectionError && <p>{connectionError}</p>}
            {actionError && <p>{actionError}</p>}
          </div>
        )}

        {initialLoad && !meters.data && <p className="py-10 text-center text-sm text-muted">Loading temperature data…</p>}
        {!initialLoad && !connectionError && !allMeters.length && (
          <p className="rounded-xl border border-dashed border-line py-10 text-center text-sm text-muted">No meters found</p>
        )}

        {activeMeters.length > 0 && (
          <section aria-labelledby="active-heading">
            <h2 id="active-heading" className="mb-3 font-semibold">Active meters</h2>
            <div className={GRID}>
              {activeMeters.map((meter) => <MeterCard key={meter.device_id} meter={meter} timeScale={timeScale} />)}
            </div>
          </section>
        )}

        {staleMeters.length > 0 && (
          <section aria-labelledby="stale-heading" className="rounded-xl border border-warning-line bg-warning-surface p-4 sm:p-5">
            <header className="mb-4 flex items-start gap-2.5 text-warning">
              <TriangleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              <div>
                <h2 id="stale-heading" className="font-semibold">未更新のメーター</h2>
                <p className="mt-1 text-sm">1週間以上更新されていないデバイス</p>
              </div>
            </header>
            <div className={GRID}>
              {staleMeters.map((meter) => <MeterCard key={meter.device_id} meter={meter} timeScale={timeScale} stale />)}
            </div>
          </section>
        )}
      </main>
    </>
  )
}
