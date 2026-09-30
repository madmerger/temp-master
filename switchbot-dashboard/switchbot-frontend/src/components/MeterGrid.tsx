import type { Meter, TimeScale } from '../types'
import MeterCard from './MeterCard'

interface MeterGridProps {
  meters: Meter[]
  timeScale: TimeScale
  reloadToken: number
}

export default function MeterGrid({ meters, timeScale, reloadToken }: MeterGridProps) {
  return (
    <div data-testid="active-meters" className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {meters.map((meter) => (
        <MeterCard key={meter.device_id} meter={meter} stale={false} timeScale={timeScale} reloadToken={reloadToken} />
      ))}
    </div>
  )
}
