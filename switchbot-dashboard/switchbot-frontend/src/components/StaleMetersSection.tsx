import { AlertTriangle } from 'lucide-react';
import type { Meter, TimeScale } from '../types';
import { MeterCard } from './MeterCard';

interface StaleMetersSectionProps {
  meters: Meter[];
  isDark: boolean;
  timeScale: TimeScale;
}

export function StaleMetersSection({ meters, isDark, timeScale }: StaleMetersSectionProps) {
  if (!meters.length) return null;

  return (
    <section className="mt-7">
      <div className="mb-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-amber-800 dark:text-amber-300">
          <AlertTriangle size={20} aria-hidden="true" />
          未更新のメーター
        </h2>
        <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">1週間以上更新されていないデバイス</p>
      </div>
      <div className="rounded-lg border border-amber-400 bg-amber-50 p-4 dark:border-amber-600 dark:bg-amber-950/40">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {meters.map((meter) => (
            <MeterCard key={meter.device_id} meter={meter} isStale isDark={isDark} timeScale={timeScale} />
          ))}
        </div>
      </div>
    </section>
  );
}
