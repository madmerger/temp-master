import type { Meter, TimeScale } from '../types'
import { isStaleMeter } from '../utils'
import MeterPanel from './MeterPanel'

interface StaleMetersSectionProps {
  meters: Meter[]
  timeScale: TimeScale
  refreshTick: number
}

export default function StaleMetersSection({
  meters,
  timeScale,
  refreshTick,
}: StaleMetersSectionProps) {
  if (!meters.length) {
    return null
  }

  return (
    <div className="meter-section">
      <div className="meter-section-header">
        <h3 className="meter-section-title">⚠ 未更新のメーター</h3>
        <p className="meter-section-subtitle">1週間以上更新されていないデバイス</p>
      </div>
      <div className="panel panel-warning stale-meters-panel">
        <div className="panel-body">
          <div className="row">
            {meters.map((meter) => (
              <div className="col-md-4 col-sm-6" key={meter.device_id}>
                <MeterPanel
                  meter={meter}
                  isStale={isStaleMeter(meter)}
                  timeScale={timeScale}
                  refreshTick={refreshTick}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
