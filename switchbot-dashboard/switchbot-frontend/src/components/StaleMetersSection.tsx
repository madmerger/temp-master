import type { MeterDevice, TimeScale } from '../api/types';
import type { Theme } from '../hooks/useTheme';
import { MeterCard } from './MeterCard';

interface Props {
  meters: MeterDevice[];
  timeScale: TimeScale;
  dataVersion: number;
  theme: Theme;
}

export function StaleMetersSection({ meters, timeScale, dataVersion, theme }: Props) {
  if (meters.length === 0) {
    return null;
  }

  return (
    <section className="mb-5">
      <div className="mb-2">
        <h3 className="m-0 text-lg font-semibold text-amber-700 dark:text-amber-300">
          <span aria-hidden="true">⚠ </span>未更新のメーター
        </h3>
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
          1週間以上更新されていないデバイス
        </p>
      </div>
      <div className="rounded-lg border border-amber-400 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/40">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {meters.map((meter) => (
            <MeterCard
              key={meter.device_id}
              meter={meter}
              timeScale={timeScale}
              dataVersion={dataVersion}
              theme={theme}
              stale
            />
          ))}
        </div>
      </div>
    </section>
  );
}
