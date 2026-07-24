import type { ReactNode } from 'react';
import { getDisplayName } from '../constants/displayNames';
import type { Meter, TimeScale } from '../types';
import { formatLastUpdated } from '../utils/format';
import TemperatureChart from './TemperatureChart';

interface Props {
  meter: Meter;
  timeScale: TimeScale;
  refreshKey: number;
  isStale?: boolean;
}

type BadgeTone = 'temp' | 'humidity' | 'battery';

function Badge({ children, tone }: { children: ReactNode; tone: BadgeTone }) {
  const tones: Record<BadgeTone, string> = {
    temp: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    humidity: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
    battery: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  };
  return (
    <span className={'rounded px-2 py-1 text-sm font-medium ' + tones[tone]}>
      {children}
    </span>
  );
}

export default function MeterCard({ meter, timeScale, refreshKey, isStale = false }: Props) {
  const name = getDisplayName(meter.device_name);
  const lastUpdated = formatLastUpdated(meter.last_updated);

  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="text-gray-900 dark:text-gray-100">{name}</strong>
          {isStale && (
            <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              7日以上未更新
            </span>
          )}
        </div>
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500 dark:bg-gray-700 dark:text-gray-400">
          {meter.device_type}
        </span>
      </div>

      <div className="flex flex-1 flex-col px-4 py-3">
        <div className="mb-3 flex flex-wrap gap-2">
          {meter.current_temperature !== null && meter.current_temperature !== undefined && (
            <Badge tone="temp">{meter.current_temperature}&deg;C</Badge>
          )}
          {meter.current_humidity !== null && meter.current_humidity !== undefined && (
            <Badge tone="humidity">{meter.current_humidity}%</Badge>
          )}
          {meter.battery !== null && meter.battery !== undefined && (
            <Badge tone="battery">{meter.battery}%</Badge>
          )}
        </div>

        {isStale ? (
          <p className="text-sm text-amber-700 dark:text-amber-400">履歴データの取得対象外</p>
        ) : (
          <TemperatureChart
            deviceId={meter.device_id}
            timeScale={timeScale}
            refreshKey={refreshKey}
          />
        )}

        {lastUpdated ? (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Last updated: {lastUpdated}
          </p>
        ) : (
          isStale && (
            <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">
              値がありません（データ未受信）
            </p>
          )
        )}
      </div>
    </div>
  );
}
