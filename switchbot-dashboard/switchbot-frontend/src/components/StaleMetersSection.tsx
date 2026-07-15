import { MeterCard } from './MeterCard'
import type { Meter, TimeScale } from '../types'

interface Props {
  meters: Meter[]
  timeScale: TimeScale
}

export function StaleMetersSection({ meters, timeScale }: Props) {
  if (meters.length === 0) {
    return null
  }
  return (
    <div className="meter-section">
      <div className="meter-section-header">
        <h3 className="meter-section-title">&#9888; 未更新のメーター</h3>
        <p className="meter-section-subtitle">1週間以上更新されていないデバイス</p>
      </div>
      <div className="panel stale-meters-panel">
        <div className="panel-body">
          <div className="row">
            {meters.map((meter) => (
              <div className="col" key={meter.device_id}>
                <MeterCard meter={meter} timeScale={timeScale} isStale />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
