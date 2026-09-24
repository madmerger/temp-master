import { backupUrl, type TimeScale } from '../api'

interface Props {
  timeScale: TimeScale
  onTimeScaleChange: (scale: TimeScale) => void
  onRefresh: () => void
  refreshing: boolean
}

const OPTIONS: { value: TimeScale; label: string }[] = [
  { value: 'hour', label: 'Last Hour' },
  { value: 'day', label: 'Last 24 Hours' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'year', label: 'Last Year' },
]

export function Controls({ timeScale, onTimeScaleChange, onRefresh, refreshing }: Props) {
  return (
    <div className="card mb-3">
      <div className="card-body d-flex flex-wrap align-items-center gap-2">
        <label htmlFor="time-scale-select" className="me-1 mb-0">
          Time Range:
        </label>
        <select
          id="time-scale-select"
          className="form-select w-auto me-3"
          value={timeScale}
          onChange={(e) => onTimeScaleChange(e.target.value as TimeScale)}
        >
          {OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button type="button" id="btn-refresh" className="btn btn-primary" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
        <a id="btn-backup" className="btn btn-outline-secondary" href={backupUrl()} target="_blank" rel="noopener">
          Download Backup
        </a>
      </div>
    </div>
  )
}
