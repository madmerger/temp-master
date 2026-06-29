import { useState, useEffect } from "react";
import type { MeterDevice, MeterReading, TimeScale, ThemeMode } from "../types";
import { getDisplayName } from "../constants/displayNames";
import { fetchHistory } from "../api";
import { MeterChart } from "./MeterChart";

interface MeterCardProps {
  meter: MeterDevice;
  timeScale: TimeScale;
  theme: ThemeMode;
  refreshKey: number;
}

export function MeterCard({ meter, timeScale, theme, refreshKey }: MeterCardProps) {
  const [history, setHistory] = useState<MeterReading[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchHistory(meter.device_id, timeScale)
      .then((data) => {
        if (!cancelled) setHistory(data.history);
      })
      .catch(() => {
        // silently ignore per-card history errors
      });
    return () => {
      cancelled = true;
    };
  }, [meter.device_id, timeScale, refreshKey]);

  const displayName = getDisplayName(meter.device_name);
  const lastUpdated = meter.last_updated
    ? new Date(meter.last_updated).toLocaleString()
    : null;

  return (
    <div className="meter-card">
      <div className="meter-card-header">
        <strong className="meter-name">{displayName}</strong>
        <span className="device-type-tag">{meter.device_type}</span>
      </div>
      <div className="meter-card-body">
        <div className="meter-stats">
          {meter.current_temperature != null && (
            <span className="badge badge-temp">
              {meter.current_temperature}&deg;C
            </span>
          )}
          {meter.current_humidity != null && (
            <span className="badge badge-humidity">
              {meter.current_humidity}%
            </span>
          )}
          {meter.battery != null && (
            <span className="badge badge-battery">
              {meter.battery}%
            </span>
          )}
        </div>
        <MeterChart history={history} timeScale={timeScale} theme={theme} />
        {lastUpdated && (
          <p className="meter-last-updated">Last updated: {lastUpdated}</p>
        )}
      </div>
    </div>
  );
}
