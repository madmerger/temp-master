import { useState, useCallback } from "react";
import type { TimeScale } from "../types";
import { TIME_SCALE_OPTIONS } from "../constants/displayNames";
import { triggerRefresh, getBackupUrl } from "../api";

interface ControlsProps {
  timeScale: TimeScale;
  onTimeScaleChange: (scale: TimeScale) => void;
  onRefreshComplete: () => void;
  onError: (message: string) => void;
}

export function Controls({
  timeScale,
  onTimeScaleChange,
  onRefreshComplete,
  onError,
}: ControlsProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await triggerRefresh();
      onRefreshComplete();
    } catch (err) {
      onError(`Failed to refresh: ${err instanceof Error ? err.message : String(err)}`);
      onRefreshComplete();
    } finally {
      setRefreshing(false);
    }
  }, [onRefreshComplete, onError]);

  const handleBackup = useCallback(() => {
    window.open(getBackupUrl(), "_blank");
  }, []);

  return (
    <div className="control-panel">
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
      <div className="control-buttons">
        <button
          className="btn btn-primary"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh Data"}
        </button>
        <button className="btn btn-secondary" onClick={handleBackup}>
          Download Backup
        </button>
      </div>
    </div>
  );
}
