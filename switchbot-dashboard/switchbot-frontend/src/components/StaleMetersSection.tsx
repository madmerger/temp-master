import type { Meter, TimeScale } from '../types';
import MeterCard from './MeterCard';
import MeterGrid from './MeterGrid';

interface StaleMetersSectionProps {
  meters: Meter[];
  timeScale: TimeScale;
  refreshKey: number;
  isDark: boolean;
}

export default function StaleMetersSection({ meters, timeScale, refreshKey, isDark }: StaleMetersSectionProps) {
  return (
    <section className="mt-6" data-testid="stale-meters-section">
      <div className="mb-2.5">
        <h3 className="flex items-center gap-1.5 text-lg font-semibold text-amber-700 dark:text-amber-400">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
          </svg>
          未更新のメーター
        </h3>
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">1週間以上更新されていないデバイス</p>
      </div>
      <div className="rounded-lg border border-amber-400 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/40">
        <MeterGrid>
          {meters.map((meter) => (
            <MeterCard
              key={meter.device_id}
              meter={meter}
              isStale
              timeScale={timeScale}
              refreshKey={refreshKey}
              isDark={isDark}
            />
          ))}
        </MeterGrid>
      </div>
    </section>
  );
}
