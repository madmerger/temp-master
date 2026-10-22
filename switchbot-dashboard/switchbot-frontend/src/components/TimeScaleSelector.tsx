import { TIME_SCALE_OPTIONS } from '../lib/constants';
import type { TimeScale } from '../types';
import styles from './Controls.module.css';

interface TimeScaleSelectorProps {
  value: TimeScale;
  onChange: (value: TimeScale) => void;
}

// チャートの表示期間（タイムスケール）を選択するセレクトボックス
export default function TimeScaleSelector({ value, onChange }: TimeScaleSelectorProps) {
  return (
    <div className={styles.formGroup}>
      <label htmlFor="time-scale-select" className={styles.label}>
        Time Range:
      </label>
      <select
        id="time-scale-select"
        className={styles.select}
        value={value}
        onChange={(e) => onChange(e.target.value as TimeScale)}
      >
        {TIME_SCALE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
