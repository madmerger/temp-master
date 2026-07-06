import { getDisplayName } from '../constants';
import { MeterChart } from './MeterChart';
import type { MeterDevice, TimeScale } from '../types';

interface MeterCardProps {
  meter: MeterDevice;
  timeScale: TimeScale;
  refreshKey: number;
}

export function MeterCard({ meter, timeScale, refreshKey }: MeterCardProps) {
  const displayName = getDisplayName(meter.device_name);

  return (
    <div className="meter-card">
      <div className="meter-card-header">
        <strong className="meter-card-title">{displayName}</strong>
        <span className="device-type-tag">{meter.device_type}</span>
      </div>
      <div className="meter-card-body">
        <div className="meter-stats">
          {meter.current_temperature != null && (
            <span className="stat-badge stat-temp">{meter.current_temperature}&deg;C</span>
          )}
          {meter.current_humidity != null && (
            <span className="stat-badge stat-humidity">{meter.current_humidity}%</span>
          )}
          {meter.battery != null && (
            <span className="stat-badge stat-battery">{meter.battery}%</span>
          )}
        </div>
        <MeterChart deviceId={meter.device_id} timeScale={timeScale} refreshKey={refreshKey} />
        {meter.last_updated && (
          <p className="meter-last-updated">
            Last updated: {new Date(meter.last_updated).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
