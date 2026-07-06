import { TIME_SCALE_OPTIONS } from '../constants';
import type { TimeScale } from '../types';

interface ControlsProps {
  timeScale: TimeScale;
  onTimeScaleChange: (scale: TimeScale) => void;
  onRefresh: () => void;
  onBackup: () => void;
  refreshing: boolean;
}

export function Controls({ timeScale, onTimeScaleChange, onRefresh, onBackup, refreshing }: ControlsProps) {
  return (
    <div className="controls-panel">
      <div className="controls-left">
        <label htmlFor="time-scale-select">Time Range:</label>
        <select
          id="time-scale-select"
          className="select-input"
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
      <div className="controls-right">
        <button className="btn btn-primary" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
        <button className="btn btn-secondary" onClick={onBackup}>
          Download Backup
        </button>
      </div>
    </div>
  );
}
