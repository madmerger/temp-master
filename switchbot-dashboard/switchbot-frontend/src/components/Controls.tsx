import type { TimeScale } from '../api/types'
import { backupUrl } from '../api/client'

const options: Array<[TimeScale, string]> = [
  ['hour', 'Last Hour'],
  ['day', 'Last 24 Hours'],
  ['week', 'Last 7 Days'],
  ['month', 'Last 30 Days'],
  ['year', 'Last Year'],
]

interface Props {
  timeScale: TimeScale
  onTimeScaleChange: (scale: TimeScale) => void
  onRefresh: () => void
  refreshing: boolean
}

export function Controls({
  timeScale,
  onTimeScaleChange,
  onRefresh,
  refreshing,
}: Props) {
  return (
    <section className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-raised p-4">
      <label className="font-bold" htmlFor="time-scale">
        Time Range:
      </label>
      <select
        id="time-scale"
        className="rounded-md border border-border bg-surface-raised px-3 py-2 text-ink"
        value={timeScale}
        onChange={(event) => onTimeScaleChange(event.target.value as TimeScale)}
      >
        {options.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <button
        className="rounded-md bg-accent px-4 py-2 font-bold text-white disabled:cursor-wait disabled:opacity-65"
        disabled={refreshing}
        onClick={onRefresh}
      >
        {refreshing ? 'Refreshing...' : 'Refresh Data'}
      </button>
      <a
        className="rounded-md border border-border px-4 py-2 font-bold text-ink no-underline"
        href={backupUrl}
        target="_blank"
        rel="noreferrer"
      >
        Download Backup
      </a>
    </section>
  )
}
