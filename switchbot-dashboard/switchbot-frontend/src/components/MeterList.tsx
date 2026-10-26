import type { Meter, TimeScale } from '../types'
import type { Theme } from '../theme'
import { isStaleMeter } from '../utils'
import { MeterPanel } from './MeterPanel'
import { StaleMetersSection } from './StaleMetersSection'

interface MeterListProps {
  meters: Meter[]
  timeScale: TimeScale
  refreshTick: number
  theme: Theme
}

export function MeterList({ meters, timeScale, refreshTick, theme }: MeterListProps) {
  const activeMeters = meters.filter((meter) => !isStaleMeter(meter))
  const staleMeters = meters.filter((meter) => isStaleMeter(meter))

  return (
    <div id="meters-container">
      {activeMeters.length > 0 && (
        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeMeters.map((meter) => (
            <MeterPanel
              key={meter.device_id}
              meter={meter}
              stale={false}
              timeScale={timeScale}
              refreshTick={refreshTick}
              theme={theme}
            />
          ))}
        </div>
      )}
      <StaleMetersSection
        meters={staleMeters}
        timeScale={timeScale}
        refreshTick={refreshTick}
        theme={theme}
      />
    </div>
  )
}
