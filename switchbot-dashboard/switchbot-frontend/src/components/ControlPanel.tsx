import { useState } from 'react';
import { TIME_SCALE_OPTIONS } from '../constants';
import type { TimeScale } from '../constants';
import { triggerRefresh, getBackupUrl } from '../api';
import styles from './ControlPanel.module.css';

interface ControlPanelProps {
  timeScale: TimeScale;
  onTimeScaleChange: (ts: TimeScale) => void;
  onRefreshComplete: () => void;
}

export function ControlPanel({ timeScale, onTimeScaleChange, onRefreshComplete }: ControlPanelProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await triggerRefresh();
    } catch {
      // Error is non-critical; data will reload anyway
    }
    onRefreshComplete();
    setRefreshing(false);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.controls}>
        <label className={styles.label} htmlFor="time-scale">
          Time Range:
        </label>
        <select
          id="time-scale"
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
        <button
          className={styles.btnPrimary}
          onClick={() => void handleRefresh()}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
        <a href={getBackupUrl()} className={styles.btnDefault} target="_blank" rel="noopener noreferrer">
          Download Backup
        </a>
      </div>
    </div>
  );
}
