import { getDisplayName } from '../utils/displayNames'
import { isStaleMeter } from '../utils/isStale'
import TemperatureChart from './TemperatureChart'
import type { MeterDevice, TimeScale } from '../api/types'

interface MeterPanelProps {
  meter: MeterDevice
  timeScale: TimeScale
  isStale?: boolean
}

export default function MeterPanel({ meter, timeScale, isStale }: MeterPanelProps) {
  const stale = isStale ?? isStaleMeter(meter)
  const displayName = getDisplayName(meter.device_name)

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="text-gray-900 dark:text-white">{displayName}</strong>
          {stale && (
            <span className="inline-flex items-center rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              7日以上未更新
            </span>
          )}
        </div>
        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300 whitespace-nowrap">
          {meter.device_type}
        </span>
      </div>

      <div className="p-4">
        <div className="flex flex-wrap gap-2 mb-3">
          {meter.current_temperature != null && (
            <span className="inline-flex items-center rounded bg-red-100 px-2 py-1 text-sm font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
              {meter.current_temperature}°C
            </span>
          )}
          {meter.current_humidity != null && (
            <span className="inline-flex items-center rounded bg-blue-100 px-2 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {meter.current_humidity}%
            </span>
          )}
          {meter.battery != null && (
            <span className="inline-flex items-center rounded bg-green-100 px-2 py-1 text-sm font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
              {meter.battery}%
            </span>
          )}
        </div>

        {stale ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            履歴データの取得対象外
          </p>
        ) : (
          <div className="h-48">
            <TemperatureChart deviceId={meter.device_id} timeScale={timeScale} />
          </div>
        )}

        {meter.last_updated ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Last updated: {new Date(meter.last_updated).toLocaleString()}
          </p>
        ) : stale ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            値がありません（データ未受信）
          </p>
        ) : null}
      </div>
    </div>
  )
}
