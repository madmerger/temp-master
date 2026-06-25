import { TIME_SCALE_OPTIONS } from '../config/constants';
import { getBackupUrl } from '../api/meters';
import type { TimeScale } from '../types';

interface ControlsProps {
  timeScale: TimeScale;
  onTimeScaleChange: (scale: TimeScale) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export function Controls({
  timeScale,
  onTimeScaleChange,
  onRefresh,
  refreshing,
}: ControlsProps) {
  return (
    <div className="card controls-card">
      <div className="controls-inner">
        <div className="control-group">
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
        <div className="control-group">
          <button
            className="btn btn-primary"
            onClick={onRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
          <a
            href={getBackupUrl()}
            className="btn btn-secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download Backup
          </a>
        </div>
      </div>
    </div>
  );
}
