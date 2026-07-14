import type { TimeScale } from "../types";

interface ControlsProps {
  timeScale: TimeScale;
  refreshing: boolean;
  onTimeScaleChange: (timeScale: TimeScale) => void;
  onRefresh: () => void;
  onBackup: () => void;
}

export function Controls({
  timeScale,
  refreshing,
  onTimeScaleChange,
  onRefresh,
  onBackup,
}: ControlsProps) {
  return (
    <section className="controls card">
      <div>
        <p className="eyebrow">Dashboard controls</p>
        <h1>Temperature overview</h1>
      </div>
      <div className="control-actions">
        <label className="field">
          <span>Time Range</span>
          <select
            value={timeScale}
            onChange={(event) => onTimeScaleChange(event.target.value as TimeScale)}
          >
            <option value="hour">Last Hour</option>
            <option value="day">Last 24 Hours</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
          </select>
        </label>
        <button className="button primary" type="button" onClick={onRefresh} disabled={refreshing}>
          <span aria-hidden="true">↻</span>
          {refreshing ? "Refreshing..." : "Refresh Data"}
        </button>
        <button className="button secondary" type="button" onClick={onBackup}>
          <span aria-hidden="true">↓</span>
          Download Backup
        </button>
      </div>
    </section>
  );
}
