import { getBackupUrl } from '../api/client'
import type { TimeScale } from '../types'

interface ControlsProps {
  timeScale: TimeScale
  onTimeScaleChange: (timeScale: TimeScale) => void
  isRefreshing: boolean
  onRefresh: () => void
}

export function Controls({
  timeScale,
  onTimeScaleChange,
  isRefreshing,
  onRefresh,
}: ControlsProps) {
  return (
    <section className="mb-5 flex flex-col gap-3 rounded border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
      <div className="flex flex-wrap items-center gap-3">
        <label className="font-semibold" htmlFor="time-scale-select">
          Time Range:
        </label>
        <select
          className="rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          id="time-scale-select"
          onChange={(event) => onTimeScaleChange(event.target.value as TimeScale)}
          value={timeScale}
        >
          <option value="hour">Last Hour</option>
          <option value="day">Last 24 Hours</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="year">Last Year</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isRefreshing}
          onClick={onRefresh}
          type="button"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
        <button
          className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          onClick={() => window.open(getBackupUrl(), '_blank')}
          type="button"
        >
          Download Backup
        </button>
      </div>
    </section>
  )
}
