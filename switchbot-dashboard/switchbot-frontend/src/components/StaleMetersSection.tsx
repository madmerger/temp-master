import type { Meter, TimeScale } from '../types';
import MeterCard from './MeterCard';

interface Props {
  meters: Meter[];
  timeScale: TimeScale;
  refreshKey: number;
}

export default function StaleMetersSection({ meters, timeScale, refreshKey }: Props) {
  if (!meters.length) return null;
  return (
    <section className="mt-8">
      <div className="mb-3">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-amber-700 dark:text-amber-400">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          未更新のメーター
        </h3>
        <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-400/80">
          1週間以上更新されていないデバイス
        </p>
      </div>
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700/60 dark:bg-amber-900/20">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {meters.map((meter) => (
            <MeterCard
              key={meter.device_id}
              meter={meter}
              timeScale={timeScale}
              refreshKey={refreshKey}
              isStale
            />
          ))}
        </div>
      </div>
    </section>
  );
}
