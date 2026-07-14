import type { Meter, TimeScale } from '../types'
import { MeterCard } from './MeterCard'

interface MeterGridProps {
  meters: Meter[]
  timeScale: TimeScale
  reloadKey: number
}

export function MeterGrid({ meters, timeScale, reloadKey }: MeterGridProps) {
  if (meters.length === 0) {
    return null
  }
  return (
    <div className="meter-grid">
      {meters.map((meter) => (
        <MeterCard
          key={meter.device_id}
          meter={meter}
          isStale={false}
          timeScale={timeScale}
          reloadKey={reloadKey}
        />
      ))}
    </div>
  )
}
