import type { Meter, TimeScale } from '../types'
import MeterCard from './MeterCard'

interface StaleMetersSectionProps {
  meters: Meter[]
  timeScale: TimeScale
  refreshToken: number
}

export default function StaleMetersSection({ meters, timeScale, refreshToken }: StaleMetersSectionProps) {
  if (meters.length === 0) {
    return null
  }

  return (
    <section className="mb-5" id="stale-meters-section">
      <div className="mb-2.5">
        <h3 className="m-0 text-lg font-semibold text-[#8a6d3b]">
          <span aria-hidden="true">{'\u26a0'}</span> 未更新のメーター
        </h3>
        <p className="mt-1 mb-0 text-xs text-[#8a6d3b]">1週間以上更新されていないデバイス</p>
      </div>
      <div className="rounded border border-[#f0ad4e] bg-[#fcf8e3] p-4">
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2 md:grid-cols-3">
          {meters.map((meter) => (
            <MeterCard
              key={meter.device_id}
              meter={meter}
              isStale
              timeScale={timeScale}
              refreshToken={refreshToken}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
