import { MeterCard } from './MeterCard'
import type { Meter, TimeScale } from '../types'

interface Props {
  meters: Meter[]
  timeScale: TimeScale
  refreshKey: number
}

export function MeterGrid({ meters, timeScale, refreshKey }: Props) {
  if (meters.length === 0) {
    return null
  }
  return (
    <div className="row">
      {meters.map((meter) => (
        <div className="col" key={meter.device_id}>
          <MeterCard
            meter={meter}
            timeScale={timeScale}
            isStale={false}
            refreshKey={refreshKey}
          />
        </div>
      ))}
    </div>
  )
}
