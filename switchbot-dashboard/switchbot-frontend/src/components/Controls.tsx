import type { TimeScale } from '../api/types'

const TIME_SCALE_LABELS: Record<TimeScale, string> = {
  hour: 'Last Hour',
  day: 'Last 24 Hours',
  week: 'Last 7 Days',
  month: 'Last 30 Days',
  year: 'Last Year',
}

interface ControlsProps {
  timeScale: TimeScale
  onChange: (timeScale: TimeScale) => void
  onRefresh: () => void
  onBackup: () => void
  refreshing: boolean
}

export default function Controls({
  timeScale,
  onChange,
  onRefresh,
  onBackup,
  refreshing,
}: ControlsProps) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded p-4 mb-4 flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <label htmlFor="time-scale" className="text-sm font-medium">
          Time Range:
        </label>
        <select
          id="time-scale"
          value={timeScale}
          onChange={(e) => onChange(e.target.value as TimeScale)}
          className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
        >
          {Object.entries(TIME_SCALE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={refreshing}
        className="px-4 py-2 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {refreshing ? 'Refreshing...' : 'Refresh Data'}
      </button>

      <button
        type="button"
        onClick={onBackup}
        className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      >
        Download Backup
      </button>
    </div>
  )
}
