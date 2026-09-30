import { getDisplayName } from '../meters';
import type { Meter, TimeScale } from '../types';
import MeterChart from './MeterChart';

interface MeterCardProps {
  meter: Meter;
  isStale: boolean;
  timeScale: TimeScale;
  refreshKey: number;
  isDark: boolean;
}

const BADGE_BASE = 'rounded px-2 py-1 text-sm font-semibold';

export default function MeterCard({ meter, isStale, timeScale, refreshKey, isDark }: MeterCardProps) {
  return (
    <div
      data-testid="meter-card"
      className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="flex items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800/80">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="text-gray-900 dark:text-gray-100">{getDisplayName(meter.device_name)}</strong>
          {isStale && (
            <span className="rounded bg-amber-500 px-1.5 py-0.5 text-xs font-semibold text-white dark:bg-amber-600">
              7日以上未更新
            </span>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-[11px] text-gray-600 dark:bg-gray-700 dark:text-gray-300">
          {meter.device_type}
        </span>
      </div>
      <div className="p-4">
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {meter.current_temperature != null && (
            <span className={`${BADGE_BASE} bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300`}>
              {meter.current_temperature}°C
            </span>
          )}
          {meter.current_humidity != null && (
            <span className={`${BADGE_BASE} bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300`}>
              {meter.current_humidity}%
            </span>
          )}
          {meter.battery != null && (
            <span className={`${BADGE_BASE} bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300`}>
              {meter.battery}%
            </span>
          )}
        </div>
        {isStale ? (
          <p className="text-sm text-amber-700 dark:text-amber-300">履歴データの取得対象外</p>
        ) : (
          <MeterChart deviceId={meter.device_id} timeScale={timeScale} refreshKey={refreshKey} isDark={isDark} />
        )}
        {meter.last_updated ? (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Last updated: {new Date(meter.last_updated).toLocaleString()}
          </p>
        ) : (
          isStale && <p className="text-sm text-amber-700 dark:text-amber-300">値がありません（データ未受信）</p>
        )}
      </div>
    </div>
  );
}
