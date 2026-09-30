import type { Meter, TimeScale } from '../types'
import MeterCard from './MeterCard'

interface StaleMetersSectionProps {
  meters: Meter[]
  timeScale: TimeScale
  reloadToken: number
}

export default function StaleMetersSection({ meters, timeScale, reloadToken }: StaleMetersSectionProps) {
  if (!meters.length) {
    return null
  }

  return (
    <section data-testid="stale-meters-section" className="mt-8">
      <div className="mb-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-amber-800 dark:text-amber-300">
          <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5 fill-current">
            <path d="M10 1.5 19.2 18H.8L10 1.5Zm0 4.4a.8.8 0 0 0-.8.8v5.1a.8.8 0 1 0 1.6 0V6.7a.8.8 0 0 0-.8-.8Zm0 9.1a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z" />
          </svg>
          未更新のメーター
        </h2>
        <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">1週間以上更新されていないデバイス</p>
      </div>
      <div className="rounded border border-amber-400 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {meters.map((meter) => (
            <MeterCard key={meter.device_id} meter={meter} stale timeScale={timeScale} reloadToken={reloadToken} />
          ))}
        </div>
      </div>
    </section>
  )
}
