import type { TimeScale } from '../types';
import styles from './Controls.module.css';

interface ControlsProps {
  timeScale: TimeScale;
  onTimeScaleChange: (timeScale: TimeScale) => void;
  onRefresh: () => void;
  onBackup: () => void;
  refreshing: boolean;
  downloading: boolean;
}

export default function Controls({
  timeScale,
  onTimeScaleChange,
  onRefresh,
  onBackup,
  refreshing,
  downloading,
}: ControlsProps) {
  return (
    <section className={styles.panel} aria-label="Dashboard controls">
      <div className={styles.panelBody}>
        <label className={styles.fieldLabel} htmlFor="time-scale-select">
          Time Range:
        </label>
        <select
          id="time-scale-select"
          className={styles.select}
          value={timeScale}
          onChange={(event) => onTimeScaleChange(event.target.value as TimeScale)}
        >
          <option value="hour">Last Hour</option>
          <option value="day">Last 24 Hours</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="year">Last Year</option>
        </select>
        <button className={styles.primaryButton} type="button" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
        <button className={styles.defaultButton} type="button" onClick={onBackup} disabled={downloading}>
          {downloading ? 'Downloading...' : 'Download Backup'}
        </button>
      </div>
    </section>
  );
}
