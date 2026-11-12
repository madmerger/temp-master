import type { TimeScale } from '../types'
import styles from './Controls.module.css'

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
    <section className={styles.panel} aria-label="Dashboard controls">
      <form className={styles.controls} onSubmit={(event) => event.preventDefault()}>
        <label className={styles.rangeControl}>
          <span>Time Range:</span>
          <select
            value={timeScale}
            onChange={(event) =>
              onTimeScaleChange(event.target.value as TimeScale)
            }
          >
            <option value="hour">Last Hour</option>
            <option value="day">Last 24 Hours</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
          </select>
        </label>
        <button
          className={styles.primaryButton}
          type="button"
          disabled={refreshing}
          onClick={onRefresh}
        >
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
        <button
          className={styles.defaultButton}
          type="button"
          disabled={downloading}
          onClick={onBackup}
        >
          {downloading ? 'Downloading...' : 'Download Backup'}
        </button>
      </form>
    </section>
  )
}
