import { getDisplayName } from '../config/displayNames';
import { MeterChart } from './MeterChart';
import type { MeterDevice, ThemeId, TimeScale } from '../types';

interface MeterPanelProps {
  meter: MeterDevice;
  timeScale: TimeScale;
  refreshKey: number;
  themeId: ThemeId;
}

export function MeterPanel({ meter, timeScale, refreshKey, themeId }: MeterPanelProps) {
  const displayName = getDisplayName(meter.device_name);

  return (
    <div className="card meter-card">
      <div className="card-header">
        <strong>{displayName}</strong>
        <span className="device-type-tag">{meter.device_type}</span>
      </div>
      <div className="card-body">
        <div className="meter-stats">
          {meter.current_temperature != null && (
            <span className="badge badge-danger">{meter.current_temperature}&deg;C</span>
          )}
          {meter.current_humidity != null && (
            <span className="badge badge-info">{meter.current_humidity}%</span>
          )}
          {meter.battery != null && (
            <span className="badge badge-success">{meter.battery}%</span>
          )}
        </div>

        <MeterChart
          deviceId={meter.device_id}
          timeScale={timeScale}
          refreshKey={refreshKey}
          themeId={themeId}
        />

        {meter.last_updated && (
          <p className="meter-last-updated">
            Last updated: {new Date(meter.last_updated).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
