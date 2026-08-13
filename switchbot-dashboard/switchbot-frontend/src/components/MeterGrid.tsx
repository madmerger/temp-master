import type { Meter, TimeScale } from '../api/types'
import { MeterCard } from './MeterCard'
export function MeterGrid({ meters, timeScale }: { meters: Meter[]; timeScale: TimeScale }) {
  return <div className="meter-grid">{meters.map((meter) => <MeterCard key={meter.device_id} meter={meter} timeScale={timeScale} />)}</div>
}
