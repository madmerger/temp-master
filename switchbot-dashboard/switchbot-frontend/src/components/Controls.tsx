import { backupUrl, type TimeScale } from "../api";
import { TIME_SCALE_OPTIONS } from "../constants";

interface Props {
  timeScale: TimeScale;
  onTimeScaleChange: (value: TimeScale) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export function Controls({
  timeScale,
  onTimeScaleChange,
  onRefresh,
  refreshing,
}: Props) {
  return (
    <div className="card controls">
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
      <button
        type="button"
        className="btn btn-primary"
        onClick={onRefresh}
        disabled={refreshing}
      >
        {refreshing ? "Refreshing..." : "Refresh Data"}
      </button>
      <a className="btn" href={backupUrl()} target="_blank" rel="noreferrer">
        Download Backup
      </a>
    </div>
  );
}
