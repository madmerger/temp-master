import type { MeterDevice, MeterReading, TimeScale } from "../api/meters";
import { getDisplayName } from "../config/displayNames";
import { MeterChart } from "./MeterChart";

interface MeterPanelProps {
  meter: MeterDevice;
  history: MeterReading[];
  timeScale: TimeScale;
}

export function MeterPanel({ meter, history, timeScale }: MeterPanelProps) {
  const displayName = getDisplayName(meter.device_name);

  return (
    <div className="panel">
      <div className="panel-heading">
        <div className="meter-panel-header">
          <strong>{displayName}</strong>
          <span className="device-type-tag">{meter.device_type}</span>
        </div>
      </div>
      <div className="panel-body">
        <div className="meter-stats">
          {meter.current_temperature != null && (
            <span className="badge badge-danger">
              {meter.current_temperature}&deg;C
            </span>
          )}
          {meter.current_humidity != null && (
            <span className="badge badge-info">
              {meter.current_humidity}%
            </span>
          )}
          {meter.battery != null && (
            <span className="badge badge-success">{meter.battery}%</span>
          )}
        </div>
        <MeterChart history={history} timeScale={timeScale} />
        {meter.last_updated && (
          <p className="meter-last-updated">
            Last updated: {new Date(meter.last_updated).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
