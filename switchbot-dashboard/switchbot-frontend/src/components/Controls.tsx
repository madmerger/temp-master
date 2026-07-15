import type { TimeScale } from '../types'

interface Props {
  timeScale: TimeScale
  onTimeScaleChange: (value: TimeScale) => void
  onRefresh: () => void
  onBackup: () => void
  refreshing: boolean
}

const TIME_SCALE_OPTIONS: { value: TimeScale; label: string }[] = [
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
  onBackup,
  refreshing,
}: Props) {
  return (
    <div className="panel">
      <div className="panel-body">
        <div className="controls">
          <div>
            <label htmlFor="time-scale-select">Time Range:</label>
            <select
              id="time-scale-select"
              className="form-control"
              value={timeScale}
              onChange={(e) => onTimeScaleChange(e.target.value as TimeScale)}
            >
              {TIME_SCALE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
          <button type="button" className="btn btn-default" onClick={onBackup}>
            Download Backup
          </button>
        </div>
      </div>
    </div>
  )
}
