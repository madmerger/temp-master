import { MeterPanel } from './MeterPanel'
import type { MeterDevice, MeterReading, TimeScale } from '../types'

interface MeterGridProps {
  meters: MeterDevice[]
  histories: Record<string, MeterReading[]>
  timeScale: TimeScale
  stale?: boolean
}

export function MeterGrid({
  meters,
  histories,
  timeScale,
  stale = false,
}: MeterGridProps) {
  if (meters.length === 0) {
    return null
  }

  return (
    <div className="row">
      {meters.map((meter) => (
        <div className="col" key={meter.device_id}>
          <MeterPanel
            meter={meter}
            isStale={stale}
            history={histories[meter.device_id] ?? []}
            timeScale={timeScale}
          />
        </div>
      ))}
    </div>
  )
}
