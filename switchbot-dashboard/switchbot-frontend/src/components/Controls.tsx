import type { TimeScale } from '../types'
import styles from './Controls.module.css'

interface ControlsProps {
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

export default function Controls({
  timeScale,
  onTimeScaleChange,
  onRefresh,
  onBackup,
  refreshing,
}: ControlsProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.field}>
        <label htmlFor="time-scale-select" className={styles.label}>
          Time Range:
        </label>
        <select
          id="time-scale-select"
          className={styles.select}
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
      <div className={styles.spacer} />
      <button
        type="button"
        className={`${styles.btn} ${styles.primary}`}
        onClick={onRefresh}
        disabled={refreshing}
      >
        {refreshing ? 'Refreshing...' : 'Refresh Data'}
      </button>
      <button
        type="button"
        className={`${styles.btn} ${styles.secondary}`}
        onClick={onBackup}
      >
        Download Backup
      </button>
    </div>
  )
}
