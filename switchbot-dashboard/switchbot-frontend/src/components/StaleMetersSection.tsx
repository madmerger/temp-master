import { MeterGrid } from './MeterGrid'
import type { MeterDevice, TimeScale } from '../types'

interface StaleMetersSectionProps {
  meters: MeterDevice[]
  timeScale: TimeScale
}

export function StaleMetersSection({
  meters,
  timeScale,
}: StaleMetersSectionProps) {
  if (meters.length === 0) {
    return null
  }

  return (
    <div className="meter-section">
      <div className="meter-section-header">
        <h3 className="meter-section-title">⚠ 未更新のメーター</h3>
        <p className="meter-section-subtitle">1週間以上更新されていないデバイス</p>
      </div>
      <div className="panel stale-meters-panel">
        <div className="panel-body">
          <MeterGrid
            meters={meters}
            histories={{}}
            timeScale={timeScale}
            stale
          />
        </div>
      </div>
    </div>
  )
}
