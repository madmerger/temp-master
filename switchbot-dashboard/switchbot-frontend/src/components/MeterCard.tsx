import { getDisplayName } from '../lib/constants';
import type { HistoryReading, Meter, TimeScale } from '../types';
import { TemperatureChart } from './TemperatureChart';

interface MeterCardProps {
  meter: Meter;
  history?: HistoryReading[];
  timeScale: TimeScale;
  isStale?: boolean;
}

function MetricBadge({ value, suffix, color }: { value: number | null; suffix: string; color: string }) {
  if (value === null || value === undefined) {
    return null;
  }
  return <span className={`rounded px-2 py-1 text-sm font-semibold ${color}`}>{value}{suffix}</span>;
}

export function MeterCard({ meter, history = [], timeScale, isStale = false }: MeterCardProps) {
  return (
    <article className={`overflow-hidden rounded-lg border shadow-sm ${isStale ? 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'}`}>
      <header className={`flex items-center justify-between gap-2 border-b px-4 py-3 ${isStale ? 'border-amber-200 dark:border-amber-800' : 'border-slate-200 dark:border-slate-700'}`}>
        <div className="flex flex-wrap items-center gap-2">
          <strong className="text-sm text-slate-900 dark:text-slate-100">{getDisplayName(meter.device_name)}</strong>
          {isStale && <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:bg-amber-800 dark:text-amber-100">7日以上未更新</span>}
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">{meter.device_type}</span>
      </header>
      <div className="px-4 py-4">
        <div className="mb-3 flex flex-wrap gap-2">
          <MetricBadge value={meter.current_temperature} suffix="°C" color="bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200" />
          <MetricBadge value={meter.current_humidity} suffix="%" color="bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200" />
          <MetricBadge value={meter.battery} suffix="%" color="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200" />
        </div>
        {isStale ? (
          <>
            <p className="text-sm text-amber-900 dark:text-amber-200">履歴データの取得対象外</p>
            {!meter.last_updated && <p className="mt-2 text-sm text-amber-900 dark:text-amber-200">値がありません（データ未受信）</p>}
          </>
        ) : (
          <TemperatureChart history={history} timeScale={timeScale} />
        )}
        {meter.last_updated && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Last updated: {new Date(meter.last_updated).toLocaleString()}</p>}
      </div>
    </article>
  );
}
