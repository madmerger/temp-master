import type {
  HistoryReading,
  MeterDevice,
  TimeScale,
} from '../api/types';
import { getDisplayName } from '../config/displayNames';
import { HistoryChart } from './HistoryChart';

interface MeterCardProps {
  meter: MeterDevice;
  history?: HistoryReading[];
  timeScale: TimeScale;
  stale?: boolean;
}

export function MeterCard({
  meter,
  history = [],
  timeScale,
  stale = false,
}: MeterCardProps) {
  return (
    <article className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <header className="flex min-h-14 items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="text-gray-900 dark:text-gray-100">
            {getDisplayName(meter.device_name)}
          </strong>
          {stale && (
            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
              7日以上未更新
            </span>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-gray-200 px-2 py-1 text-[11px] text-gray-600 dark:bg-gray-700 dark:text-gray-300">
          {meter.device_type}
        </span>
      </header>
      <div className="p-4">
        <div className="mb-3 flex min-h-7 flex-wrap gap-2">
          {meter.current_temperature !== null &&
            meter.current_temperature !== undefined && (
              <span className="rounded bg-red-600 px-2 py-1 text-sm font-medium text-white dark:bg-red-700">
                {meter.current_temperature}°C
              </span>
            )}
          {meter.current_humidity !== null &&
            meter.current_humidity !== undefined && (
              <span className="rounded bg-sky-600 px-2 py-1 text-sm font-medium text-white dark:bg-sky-700">
                {meter.current_humidity}%
              </span>
            )}
          {meter.battery !== null && meter.battery !== undefined && (
            <span className="rounded bg-green-600 px-2 py-1 text-sm font-medium text-white dark:bg-green-700">
              {meter.battery}%
            </span>
          )}
        </div>
        {stale ? (
          <p className="mb-2 py-2 text-sm text-amber-800 dark:text-amber-200">
            履歴データの取得対象外
          </p>
        ) : (
          <HistoryChart history={history} timeScale={timeScale} />
        )}
        {meter.last_updated ? (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Last updated: {new Date(meter.last_updated).toLocaleString()}
          </p>
        ) : (
          stale && (
            <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
              値がありません（データ未受信）
            </p>
          )
        )}
      </div>
    </article>
  );
}
