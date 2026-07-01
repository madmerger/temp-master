import type { TimeScale } from "../api/meters";

interface ControlPanelProps {
  timeScale: TimeScale;
  onTimeScaleChange: (scale: TimeScale) => void;
  onRefresh: () => void;
  onBackup: () => void;
  refreshing: boolean;
}

const TIME_SCALE_OPTIONS: { value: TimeScale; label: string }[] = [
  { value: "hour", label: "Last Hour" },
  { value: "day", label: "Last 24 Hours" },
  { value: "week", label: "Last 7 Days" },
  { value: "month", label: "Last 30 Days" },
  { value: "year", label: "Last Year" },
];

export function ControlPanel({
  timeScale,
  onTimeScaleChange,
  onRefresh,
  onBackup,
  refreshing,
}: ControlPanelProps) {
  return (
    <div className="panel">
      <div className="panel-body controls-row">
        <div className="form-group">
          <label htmlFor="time-scale-select">Time Range:</label>
          <select
            id="time-scale-select"
            className="form-select"
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
        <button
          type="button"
          className="btn btn-primary"
          onClick={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh Data"}
        </button>
        <button type="button" className="btn btn-default" onClick={onBackup}>
          Download Backup
        </button>
      </div>
    </div>
  );
}
