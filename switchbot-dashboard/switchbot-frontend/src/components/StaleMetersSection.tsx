import type { Meter, TimeScale } from '../types'
import type { Theme } from '../theme'
import { MeterPanel } from './MeterPanel'

interface StaleMetersSectionProps {
  meters: Meter[]
  timeScale: TimeScale
  refreshTick: number
  theme: Theme
}

export function StaleMetersSection({ meters, timeScale, refreshTick, theme }: StaleMetersSectionProps) {
  if (meters.length === 0) {
    return null
  }

  return (
    <section className="mb-5">
      <div className="mb-3">
        <h2 className="m-0 text-lg font-semibold text-warning-text">
          <span aria-hidden="true">⚠ </span>未更新のメーター
        </h2>
        <p className="mb-0 mt-1 text-xs text-warning-text">1週間以上更新されていないデバイス</p>
      </div>
      <div className="rounded border border-warning-border bg-warning-bg p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {meters.map((meter) => (
            <MeterPanel
              key={meter.device_id}
              meter={meter}
              stale
              timeScale={timeScale}
              refreshTick={refreshTick}
              theme={theme}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
