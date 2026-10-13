import type { TimeScale } from '../types'

interface ControlsProps {
  timeScale: TimeScale
  onTimeScaleChange: (timeScale: TimeScale) => void
  onRefresh: () => void
  onDownloadBackup: () => void
  refreshing: boolean
  downloading: boolean
}

const timeScaleOptions: { value: TimeScale; label: string }[] = [
  { value: 'hour', label: 'Last Hour' },
  { value: 'day', label: 'Last 24 Hours' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'year', label: 'Last Year' },
]

export function Controls({
  timeScale,
  onTimeScaleChange,
  onRefresh,
  onDownloadBackup,
  refreshing,
  downloading,
}: ControlsProps) {
  return (
    <section className="panel">
      <div className="panel-body controls">
        <div className="form-group">
          <label htmlFor="time-scale-select">Time Range:</label>
          <select
            id="time-scale-select"
            className="form-control"
            value={timeScale}
            onChange={(event) => onTimeScaleChange(event.target.value as TimeScale)}
          >
            {timeScaleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="btn btn-primary" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
        <button type="button" className="btn btn-default" onClick={onDownloadBackup} disabled={downloading}>
          {downloading ? 'Downloading...' : 'Download Backup'}
        </button>
      </div>
    </section>
  )
}
