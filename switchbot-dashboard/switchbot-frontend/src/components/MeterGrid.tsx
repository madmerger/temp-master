import MeterPanel from './MeterPanel'
import type { MeterDevice, TimeScale } from '../api/types'

interface MeterGridProps {
  meters: MeterDevice[]
  timeScale: TimeScale
}

export default function MeterGrid({ meters, timeScale }: MeterGridProps) {
  if (meters.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {meters.map((meter) => (
        <MeterPanel key={meter.device_id} meter={meter} timeScale={timeScale} isStale={false} />
      ))}
    </div>
  )
}
