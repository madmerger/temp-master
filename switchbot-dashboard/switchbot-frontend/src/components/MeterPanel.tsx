import { getDisplayName } from '../utils';
import { MeterChart } from './MeterChart';
import type { Meter, TimeScale } from '../types';

interface MeterPanelProps {
  meter: Meter;
  isStale: boolean;
  timeScale: TimeScale;
  refreshKey: number;
}

export function MeterPanel({ meter, isStale, timeScale, refreshKey }: MeterPanelProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div className="flex items-center flex-wrap">
            <strong className="text-gray-900 dark:text-gray-100">{getDisplayName(meter.device_name)}</strong>
            {isStale && (
              <span className="ml-2 inline-block px-2 py-0.5 rounded text-xs font-semibold bg-yellow-500 text-white">
                7日以上未更新
              </span>
            )}
          </div>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full">
            {meter.device_type}
          </span>
        </div>
      </div>
      <div className="p-4">
        <div className="mb-2 flex gap-1.5">
          {meter.current_temperature !== null && meter.current_temperature !== undefined && (
            <span className="px-2 py-0.5 rounded text-sm font-semibold bg-red-600 text-white">
              {meter.current_temperature}°C
            </span>
          )}
          {meter.current_humidity !== null && meter.current_humidity !== undefined && (
            <span className="px-2 py-0.5 rounded text-sm font-semibold bg-blue-500 text-white">
              {meter.current_humidity}%
            </span>
          )}
          {meter.battery !== null && meter.battery !== undefined && (
            <span className="px-2 py-0.5 rounded text-sm font-semibold bg-green-600 text-white">
              {meter.battery}%
            </span>
          )}
        </div>
        {isStale ? (
          <p className="text-yellow-800 dark:text-yellow-200 m-0">履歴データの取得対象外</p>
        ) : (
          <MeterChart deviceId={meter.device_id} timeScale={timeScale} refreshKey={refreshKey} />
        )}
        {meter.last_updated ? (
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-2 mb-0">
            Last updated: {new Date(meter.last_updated).toLocaleString()}
          </p>
        ) : (
          isStale && <p className="text-yellow-800 dark:text-yellow-200 m-0">値がありません（データ未受信）</p>
        )}
      </div>
    </div>
  );
}
