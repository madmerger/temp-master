import type { Meter, TimeScale } from '../api/types';
import { useHistory } from '../hooks/useHistory';
import { getDisplayName } from '../utils/displayNames';
import { isStaleMeter } from '../utils/stale';
import TemperatureChart from './TemperatureChart';

interface Props {
  meter: Meter;
  timeScale: TimeScale;
  stale?: boolean;
}

export default function MeterPanel({ meter, timeScale, stale = false }: Props) {
  const meterIsStale = stale || isStaleMeter(meter);
  const history = useHistory(meter.device_id, timeScale, !meterIsStale);
  return (
    <article className="overflow-hidden rounded border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <header className="flex items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-700">
        <div className="flex flex-wrap items-center gap-2">
          <strong>{getDisplayName(meter.device_name)}</strong>
          {meterIsStale && (
            <span className="rounded bg-yellow-500 px-2 py-0.5 text-xs font-semibold text-white">
              7日以上未更新
            </span>
          )}
        </div>
        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-600 dark:text-gray-100">
          {meter.device_type}
        </span>
      </header>
      <div className="p-4">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {meter.current_temperature != null && (
            <span className="rounded bg-red-600 px-2 py-1 text-sm font-semibold text-white">
              {meter.current_temperature}°C
            </span>
          )}
          {meter.current_humidity != null && (
            <span className="rounded bg-sky-500 px-2 py-1 text-sm font-semibold text-white">
              {meter.current_humidity}%
            </span>
          )}
          {meter.battery != null && (
            <span className="rounded bg-green-600 px-2 py-1 text-sm font-semibold text-white">
              {meter.battery}%
            </span>
          )}
        </div>
        {meterIsStale ? (
          <p className="py-14 text-sm text-yellow-800 dark:text-yellow-300">
            履歴データの取得対象外
          </p>
        ) : (
          <TemperatureChart readings={history.data?.history ?? []} timeScale={timeScale} />
        )}
        {meter.last_updated ? (
          <p className="mt-2 text-xs text-gray-500">
            Last updated: {new Date(meter.last_updated).toLocaleString()}
          </p>
        ) : (
          meterIsStale && (
            <p className="mt-2 text-sm text-yellow-800 dark:text-yellow-300">
              値がありません（データ未受信）
            </p>
          )
        )}
      </div>
    </article>
  );
}
