import type { Meter, TimeScale } from '../types'
import { MeterPanel } from './MeterPanel'

interface Props {
  meters: Meter[]
  timeScale: TimeScale
}

export function StaleMetersSection({ meters, timeScale }: Props) {
  return (
    <section className="mb-5">
      <div className="mb-2">
        <h3 className="m-0 text-lg font-semibold text-amber-700 dark:text-amber-400">
          ⚠ 未更新のメーター
        </h3>
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
          1週間以上更新されていないデバイス
        </p>
      </div>
      <div className="rounded border border-amber-400 bg-amber-50 p-4 dark:border-amber-600/60 dark:bg-amber-950/30">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {meters.map((meter) => (
            <MeterPanel
              key={meter.device_id}
              meter={meter}
              isStale
              history={[]}
              timeScale={timeScale}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
