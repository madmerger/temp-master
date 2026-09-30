import type { TimeScale } from '../types'

interface ControlsProps {
  timeScale: TimeScale
  onTimeScaleChange: (timeScale: TimeScale) => void
  onRefresh: () => void
  onBackup: () => void
  refreshing: boolean
}

const timeScales: { value: TimeScale; label: string }[] = [
  { value: 'hour', label: 'Last Hour' },
  { value: 'day', label: 'Last 24 Hours' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'year', label: 'Last Year' },
]

export default function Controls({ timeScale, onTimeScaleChange, onRefresh, onBackup, refreshing }: ControlsProps) {
  return (
    <section className="mb-4 rounded border border-gray-300 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-wrap items-center gap-3 p-4">
        <label htmlFor="time-scale-select" className="text-sm font-medium text-gray-700 dark:text-gray-200">Time Range:</label>
        <select
          id="time-scale-select"
          data-testid="time-scale-select"
          value={timeScale}
          onChange={(event) => onTimeScaleChange(event.target.value as TimeScale)}
          className="rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        >
          {timeScales.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>
        <button
          type="button"
          data-testid="btn-refresh"
          onClick={onRefresh}
          disabled={refreshing}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
        <button
          type="button"
          data-testid="btn-backup"
          onClick={onBackup}
          className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
        >
          Download Backup
        </button>
      </div>
    </section>
  )
}
