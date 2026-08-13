import type { Meter, TimeScale } from '../api/types'
import { MeterCard } from './MeterCard'

interface Props {
  meters: Meter[]
  timeScale: TimeScale
}

export function MeterGrid({ meters, timeScale }: Props) {
  return (
    <div className="mt-[22px] grid grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))] gap-[18px]">
      {meters.map((meter) => (
        <MeterCard key={meter.device_id} meter={meter} timeScale={timeScale} />
      ))}
    </div>
  )
}
