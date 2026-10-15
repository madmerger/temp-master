import { BatteryMedium, Droplets, Thermometer } from 'lucide-react';
import { getDisplayName } from '../lib/displayNames';
import type { Meter, TimeScale } from '../types';
import { MeterChart } from './MeterChart';

interface MeterCardProps {
  meter: Meter;
  isStale: boolean;
  isDark: boolean;
  timeScale: TimeScale;
}

export function MeterCard({ meter, isStale, isDark, timeScale }: MeterCardProps) {
  return (
    <article
      data-testid="meter-card"
      className="h-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <header className="flex min-h-14 items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/80">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {getDisplayName(meter.device_name)}
          </strong>
          {isStale && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900/70 dark:text-amber-100">
              7日以上未更新
            </span>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
          {meter.device_type}
        </span>
      </header>

      <div className="p-4">
        <div className="mb-3 flex min-h-7 flex-wrap gap-2">
          {meter.current_temperature !== null && meter.current_temperature !== undefined && (
            <span className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm font-medium text-red-800 dark:text-red-200">
              <Thermometer size={15} aria-hidden="true" />
              {meter.current_temperature}°C
            </span>
          )}
          {meter.current_humidity !== null && meter.current_humidity !== undefined && (
            <span className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm font-medium text-blue-800 dark:text-blue-200">
              <Droplets size={15} aria-hidden="true" />
              {meter.current_humidity}%
            </span>
          )}
          {meter.battery !== null && meter.battery !== undefined && (
            <span className="inline-flex items-center gap-1 rounded px-2 py-1 text-sm font-medium text-green-800 dark:text-green-200">
              <BatteryMedium size={15} aria-hidden="true" />
              {meter.battery}%
            </span>
          )}
        </div>

        {isStale ? (
          <p className="min-h-[200px] pt-2 text-sm text-amber-800 dark:text-amber-200">
            履歴データの取得対象外
          </p>
        ) : (
          <div className="relative h-[200px]">
            <MeterChart deviceId={meter.device_id} timeScale={timeScale} isDark={isDark} />
          </div>
        )}

        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {meter.last_updated
            ? `Last updated: ${new Date(meter.last_updated).toLocaleString()}`
            : isStale
              ? '値がありません（データ未受信）'
              : ''}
        </p>
      </div>
    </article>
  );
}
