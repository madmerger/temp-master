import type { TimeScale } from '../types'

interface ControlsProps {
  timeScale: TimeScale
  onTimeScaleChange: (timeScale: TimeScale) => void
  onRefresh: () => void
  onBackup: () => void
  refreshing: boolean
  downloading: boolean
}

export function Controls({
  timeScale,
  onTimeScaleChange,
  onRefresh,
  onBackup,
  refreshing,
  downloading,
}: ControlsProps) {
  return (
    <section className="mb-5 rounded border border-border bg-panel p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-semibold" htmlFor="time-scale-select">
          Time Range:
          <select
            id="time-scale-select"
            value={timeScale}
            onChange={(event) => onTimeScaleChange(event.target.value as TimeScale)}
            className="rounded border border-border bg-panel px-3 py-2 font-normal text-text focus-visible:outline-2 focus-visible:outline-primary"
          >
            <option value="hour">Last Hour</option>
            <option value="day">Last 24 Hours</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
          </select>
        </label>
        <button
          id="btn-refresh"
          type="button"
          disabled={refreshing}
          onClick={onRefresh}
          className="rounded bg-primary px-3 py-2 text-sm font-medium text-label-text hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
        <button
          id="btn-backup"
          type="button"
          disabled={downloading}
          onClick={onBackup}
          className="rounded border border-border bg-panel-heading px-3 py-2 text-sm font-medium text-text hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {downloading ? 'Downloading...' : 'Download Backup'}
        </button>
      </div>
    </section>
  )
}
