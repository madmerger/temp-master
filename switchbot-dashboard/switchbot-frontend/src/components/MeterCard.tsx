import type { MeterDevice, TimeScale } from '../types/api';
import { getDisplayName } from '../types/api';
import { TemperatureChart } from './TemperatureChart';

interface Props {
  meter: MeterDevice;
  timeScale: TimeScale;
}

export function MeterCard({ meter, timeScale }: Props) {
  const displayName = getDisplayName(meter.device_name);
  const lastUpdated = meter.last_updated
    ? new Date(meter.last_updated).toLocaleString()
    : null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <span className="font-semibold text-gray-800">{displayName}</span>
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-500">
          {meter.device_type}
        </span>
      </div>

      <div className="px-4 pt-3">
        <div className="mb-2 flex flex-wrap gap-2">
          {meter.current_temperature != null && (
            <span className="rounded-md bg-red-50 px-2 py-1 text-sm font-medium text-red-700">
              {meter.current_temperature}&deg;C
            </span>
          )}
          {meter.current_humidity != null && (
            <span className="rounded-md bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700">
              {meter.current_humidity}%
            </span>
          )}
          {meter.battery != null && (
            <span className="rounded-md bg-green-50 px-2 py-1 text-sm font-medium text-green-700">
              {meter.battery}%
            </span>
          )}
        </div>

        <TemperatureChart deviceId={meter.device_id} timeScale={timeScale} />

        {lastUpdated && (
          <p className="pb-3 pt-1 text-xs text-gray-400">
            Last updated: {lastUpdated}
          </p>
        )}
      </div>
    </div>
  );
}
