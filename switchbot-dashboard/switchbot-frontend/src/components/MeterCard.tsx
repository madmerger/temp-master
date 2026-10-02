import { getDisplayName } from '../constants'
import type { Meter, TimeScale } from '../types'
import MeterChart from './MeterChart'

interface MeterCardProps {
  meter: Meter
  isStale: boolean
  timeScale: TimeScale
  refreshToken: number
}

const BADGE_CLASS = 'mr-1.5 inline-block rounded px-2 py-1 text-sm font-bold leading-none text-white'

function hasValue<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

export default function MeterCard({ meter, isStale, timeScale, refreshToken }: MeterCardProps) {
  return (
    <div className="meter-panel mb-5 rounded border border-[#ddd] bg-white shadow-sm" data-device-id={meter.device_id}>
      <div className="flex items-center justify-between rounded-t border-b border-[#ddd] bg-[#f8f8f8] px-4 py-2.5">
        <div className="flex flex-wrap items-center">
          <strong className="meter-name">{getDisplayName(meter.device_name)}</strong>
          {isStale && (
            <span className="ml-2 inline-block rounded bg-[#f0ad4e] px-1.5 py-0.5 text-xs font-bold text-white">
              7日以上未更新
            </span>
          )}
        </div>
        <span className="device-type-tag rounded-full bg-[#eee] px-2 py-0.5 text-[11px] text-[#777]">
          {meter.device_type}
        </span>
      </div>
      <div className="p-4">
        <div className="mb-2.5">
          {hasValue(meter.current_temperature) && (
            <span className={`${BADGE_CLASS} bg-[#d9534f]`}>{meter.current_temperature}{'\u00b0C'}</span>
          )}
          {hasValue(meter.current_humidity) && (
            <span className={`${BADGE_CLASS} bg-[#5bc0de]`}>{meter.current_humidity}%</span>
          )}
          {hasValue(meter.battery) && <span className={`${BADGE_CLASS} bg-[#5cb85c]`}>{meter.battery}%</span>}
        </div>
        {isStale ? (
          <p className="m-0 text-[#8a6d3b]">履歴データの取得対象外</p>
        ) : (
          <MeterChart
            key={`${meter.device_id}-${timeScale}`}
            deviceId={meter.device_id}
            timeScale={timeScale}
            refreshToken={refreshToken}
          />
        )}
        {meter.last_updated ? (
          <p className="mt-2 mb-0 text-xs text-[#777]">
            Last updated: {new Date(meter.last_updated).toLocaleString()}
          </p>
        ) : (
          isStale && <p className="m-0 text-[#8a6d3b]">値がありません（データ未受信）</p>
        )}
      </div>
    </div>
  )
}
