import { getDisplayName } from '../lib/displayNames'
import type { Meter, TimeScale } from '../types'
import TemperatureChart from './TemperatureChart'

interface MeterCardProps {
  meter: Meter
  stale: boolean
  timeScale: TimeScale
  reloadToken: number
}

export default function MeterCard({ meter, stale, timeScale, reloadToken }: MeterCardProps) {
  const displayName = getDisplayName(meter.device_name)

  return (
    <article
      data-testid={`meter-card-${meter.device_id}`}
      data-stale={String(stale)}
      className="overflow-hidden rounded border border-gray-300 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <div className="flex min-h-12 items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="text-sm text-gray-800 dark:text-gray-100">{displayName}</strong>
          {stale && <span className="rounded bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">7日以上未更新</span>}
        </div>
        <span className="shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-[11px] text-gray-600 dark:bg-gray-700 dark:text-gray-300">{meter.device_type}</span>
      </div>
      <div className="p-4">
        <div className="mb-2 flex min-h-6 flex-wrap gap-1.5">
          {meter.current_temperature != null && (
            <span className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white">{meter.current_temperature}°C</span>
          )}
          {meter.current_humidity != null && (
            <span className="rounded bg-cyan-600 px-2 py-1 text-xs font-semibold text-white">{meter.current_humidity}%</span>
          )}
          {meter.battery != null && (
            <span className="rounded bg-green-600 px-2 py-1 text-xs font-semibold text-white">{meter.battery}%</span>
          )}
        </div>
        {stale ? (
          <p className="text-sm text-amber-800 dark:text-amber-200">履歴データの取得対象外</p>
        ) : (
          <TemperatureChart
            deviceId={meter.device_id}
            displayName={displayName}
            timeScale={timeScale}
            reloadToken={reloadToken}
          />
        )}
        {meter.last_updated ? (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Last updated: {new Date(meter.last_updated).toLocaleString()}</p>
        ) : stale ? (
          <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">値がありません（データ未受信）</p>
        ) : null}
      </div>
    </article>
  )
}
