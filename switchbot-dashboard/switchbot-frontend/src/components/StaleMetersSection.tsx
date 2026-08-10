import { AlertTriangle } from 'lucide-react'
import MeterPanel from './MeterPanel'
import type { MeterDevice, TimeScale } from '../api/types'

interface StaleMetersSectionProps {
  meters: MeterDevice[]
  timeScale: TimeScale
}

export default function StaleMetersSection({ meters, timeScale }: StaleMetersSectionProps) {
  if (meters.length === 0) {
    return null
  }

  return (
    <section className="mt-8">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
          <AlertTriangle size={20} />
          未更新のメーター
        </h3>
        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
          1週間以上更新されていないデバイス
        </p>
      </div>
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {meters.map((meter) => (
            <MeterPanel
              key={meter.device_id}
              meter={meter}
              timeScale={timeScale}
              isStale
            />
          ))}
        </div>
      </div>
    </section>
  )
}
