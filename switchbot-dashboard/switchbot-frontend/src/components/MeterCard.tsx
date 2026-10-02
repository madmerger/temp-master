import type { Meter, TimeScale } from '../types'
import { getDisplayName } from '../utils/displayNames'
import { TemperatureChart } from './TemperatureChart'

interface MeterCardProps {
  meter: Meter
  isStale?: boolean
  timeScale: TimeScale
}

export function MeterCard({
  meter,
  isStale = false,
  timeScale,
}: MeterCardProps) {
  return (
    <article className="overflow-hidden rounded border border-gray-200 bg-white shadow-sm">
      <header className="flex min-h-14 items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3">
        <div className="flex flex-wrap items-center gap-y-1">
          <strong className="text-sm text-gray-800">
            {getDisplayName(meter.device_name)}
          </strong>
          {isStale && (
            <span className="ml-2 rounded bg-amber-500 px-2 py-1 text-xs font-medium text-white">
              7日以上未更新
            </span>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-gray-200 px-2 py-1 text-[11px] text-gray-600">
          {meter.device_type}
        </span>
      </header>
      <div className="p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {meter.current_temperature !== null && meter.current_temperature !== undefined && (
            <span className="rounded bg-[#d9534f] px-2 py-1 text-sm text-white">
              {meter.current_temperature}°C
            </span>
          )}
          {meter.current_humidity !== null && meter.current_humidity !== undefined && (
            <span className="rounded bg-[#5bc0de] px-2 py-1 text-sm text-white">
              {meter.current_humidity}%
            </span>
          )}
          {meter.battery !== null && meter.battery !== undefined && (
            <span className="rounded bg-[#5cb85c] px-2 py-1 text-sm text-white">
              {meter.battery}%
            </span>
          )}
        </div>
        {isStale ? (
          <p className="m-0 text-sm text-amber-800">履歴データの取得対象外</p>
        ) : (
          <TemperatureChart meter={meter} timeScale={timeScale} />
        )}
        {meter.last_updated ? (
          <p className="mb-0 mt-2 text-xs text-gray-500">
            Last updated: {new Date(meter.last_updated).toLocaleString()}
          </p>
        ) : isStale ? (
          <p className="mb-0 mt-2 text-sm text-amber-800">
            値がありません（データ未受信）
          </p>
        ) : null}
      </div>
    </article>
  )
}
