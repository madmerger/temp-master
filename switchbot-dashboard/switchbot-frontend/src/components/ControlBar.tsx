import { backupUrl } from '../api/client';
import type { TimeScale } from '../api/types';
import styles from './ControlBar.module.css';

interface ControlBarProps {
  timeScale: TimeScale;
  onTimeScaleChange: (timeScale: TimeScale) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const scales: Array<{ value: TimeScale; label: string }> = [
  { value: 'hour', label: 'Last Hour' },
  { value: 'day', label: 'Last 24 Hours' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'year', label: 'Last Year' },
];

export default function ControlBar({ timeScale, onTimeScaleChange, onRefresh, isRefreshing }: ControlBarProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.body}>
        <div className={styles.group}>
          <label htmlFor="time-scale-select">Time Range:</label>
          <select
            id="time-scale-select"
            value={timeScale}
            onChange={(event) => onTimeScaleChange(event.target.value as TimeScale)}
          >
            {scales.map((scale) => (
              <option key={scale.value} value={scale.value}>
                {scale.label}
              </option>
            ))}
          </select>
        </div>
        <button className={styles.primaryButton} type="button" disabled={isRefreshing} onClick={onRefresh}>
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
        <button className={styles.defaultButton} type="button" onClick={() => window.open(backupUrl, '_blank')}>
          Download Backup
        </button>
      </div>
    </div>
  );
}
