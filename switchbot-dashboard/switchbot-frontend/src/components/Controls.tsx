import type { TimeScale } from '../types'

const TIME_SCALE_OPTIONS: { value: TimeScale; label: string }[] = [
  { value: 'hour', label: 'Last Hour' },
  { value: 'day', label: 'Last 24 Hours' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'year', label: 'Last Year' },
]

interface ControlsProps {
  timeScale: TimeScale
  onTimeScaleChange: (scale: TimeScale) => void
  onRefresh: () => void
  onBackup: () => void
  refreshing: boolean
}

export function Controls({
  timeScale,
  onTimeScaleChange,
  onRefresh,
  onBackup,
  refreshing,
}: ControlsProps) {
  return (
    <div className="controls">
      <div className="control-group">
        <label htmlFor="time-scale-select">Time Range:</label>
        <select
          id="time-scale-select"
          className="select"
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
      <div className="spacer" />
      <button
        type="button"
        className="btn primary"
        onClick={onRefresh}
        disabled={refreshing}
      >
        {refreshing ? 'Refreshing...' : 'Refresh Data'}
      </button>
      <button type="button" className="btn" onClick={onBackup}>
        Download Backup
      </button>
    </div>
  )
}
