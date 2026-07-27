import type { TimeScale } from '../types'

const TIME_SCALE_OPTIONS: { value: TimeScale; label: string }[] = [
  { value: 'hour', label: 'Last Hour' },
  { value: 'day', label: 'Last 24 Hours' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'year', label: 'Last Year' },
]

interface Props {
  timeScale: TimeScale
  onTimeScaleChange: (timeScale: TimeScale) => void
  onRefresh: () => void
  onBackup: () => void
  refreshing: boolean
}

export function Controls({ timeScale, onTimeScaleChange, onRefresh, onBackup, refreshing }: Props) {
  return (
    <div className="mb-4 rounded border border-slate-300 bg-white p-4">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="time-scale-select" className="text-slate-700">
          Time Range:
        </label>
        <select
          id="time-scale-select"
          value={timeScale}
          onChange={(event) => onTimeScaleChange(event.target.value as TimeScale)}
          className="rounded border border-slate-300 bg-white px-3 py-1.5 text-slate-800"
        >
          {TIME_SCALE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="rounded bg-blue-600 px-3 py-1.5 text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
        <button
          type="button"
          onClick={onBackup}
          className="rounded border border-slate-300 bg-white px-3 py-1.5 text-slate-700 transition-colors hover:bg-slate-100"
        >
          Download Backup
        </button>
      </div>
    </div>
  )
}
