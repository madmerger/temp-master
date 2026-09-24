import { MeterPanel } from './MeterPanel';
import type { Meter, TimeScale } from '../types';

interface StaleMetersSectionProps {
  meters: Meter[];
  timeScale: TimeScale;
  refreshKey: number;
}

export function StaleMetersSection({ meters, timeScale, refreshKey }: StaleMetersSectionProps) {
  if (meters.length === 0) return null;
  return (
    <div className="mb-5">
      <div className="mb-2">
        <h3 className="m-0 text-lg font-semibold text-yellow-800 dark:text-yellow-200">
          ⚠ 未更新のメーター
        </h3>
        <p className="mt-1 mb-0 text-xs text-yellow-800 dark:text-yellow-200">
          1週間以上更新されていないデバイス
        </p>
      </div>
      <div className="border border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {meters.map((m) => (
            <MeterPanel key={m.device_id} meter={m} isStale timeScale={timeScale} refreshKey={refreshKey} />
          ))}
        </div>
      </div>
    </div>
  );
}
