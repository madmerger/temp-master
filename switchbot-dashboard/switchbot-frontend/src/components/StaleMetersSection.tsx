import type { Meter, TimeScale } from '../types'
import { MeterCard } from './MeterCard'
import { WarningIcon } from './icons'

interface StaleMetersSectionProps {
  meters: Meter[]
  timeScale: TimeScale
  reloadKey: number
}

export function StaleMetersSection({
  meters,
  timeScale,
  reloadKey,
}: StaleMetersSectionProps) {
  if (meters.length === 0) {
    return null
  }
  return (
    <section className="section">
      <div className="section-header">
        <h3 className="section-title">
          <WarningIcon /> 未更新のメーター
        </h3>
        <p className="section-subtitle">1週間以上更新されていないデバイス</p>
      </div>
      <div className="stale-panel">
        <div className="meter-grid">
          {meters.map((meter) => (
            <MeterCard
              key={meter.device_id}
              meter={meter}
              isStale
              timeScale={timeScale}
              reloadKey={reloadKey}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
