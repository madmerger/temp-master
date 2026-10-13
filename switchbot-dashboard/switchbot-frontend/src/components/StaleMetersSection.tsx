import { MeterCard } from './MeterCard'
import type { Meter, TimeScale } from '../types'

interface StaleMetersSectionProps {
  meters: Meter[]
  timeScale: TimeScale
}

export function StaleMetersSection({ meters, timeScale }: StaleMetersSectionProps) {
  if (meters.length === 0) {
    return null
  }

  return (
    <section className="meter-section">
      <div className="meter-section-header">
        <h3 className="meter-section-title">
          <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
            <path d="M8 1.5 15 14H1L8 1.5Zm0 4v4m0 2v.1" />
          </svg>{' '}
          未更新のメーター
        </h3>
        <p className="meter-section-subtitle">1週間以上更新されていないデバイス</p>
      </div>
      <div className="panel stale-meters-panel">
        <div className="panel-body">
          <div className="meter-grid">
            {meters.map((meter) => (
              <MeterCard key={meter.device_id} meter={meter} isStale timeScale={timeScale} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
