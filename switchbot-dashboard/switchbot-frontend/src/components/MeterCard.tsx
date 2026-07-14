import { getDisplayName } from '../displayNames'
import type { Meter, TimeScale } from '../types'
import { TemperatureChart } from './TemperatureChart'

interface MeterCardProps {
  meter: Meter
  isStale: boolean
  timeScale: TimeScale
  reloadKey: number
}

export function MeterCard({ meter, isStale, timeScale, reloadKey }: MeterCardProps) {
  const displayName = getDisplayName(meter.device_name)
  const hasTemp =
    meter.current_temperature !== null && meter.current_temperature !== undefined
  const hasHumidity =
    meter.current_humidity !== null && meter.current_humidity !== undefined
  const hasBattery = meter.battery !== null && meter.battery !== undefined

  return (
    <div className={`meter-card${isStale ? ' stale' : ''}`}>
      <div className="meter-card-header">
        <div className="meter-title">
          <strong>{displayName}</strong>
          {isStale && <span className="badge warn">7日以上未更新</span>}
        </div>
        <span className="device-type-tag">{meter.device_type}</span>
      </div>
      <div className="meter-card-body">
        <div className="badges">
          {hasTemp && (
            <span className="badge temp">{`${meter.current_temperature}\u00b0C`}</span>
          )}
          {hasHumidity && (
            <span className="badge humidity">{`${meter.current_humidity}%`}</span>
          )}
          {hasBattery && (
            <span className="badge battery">{`${meter.battery}%`}</span>
          )}
        </div>

        {isStale ? (
          <p className="stale-note">履歴データの取得対象外</p>
        ) : (
          <TemperatureChart
            deviceId={meter.device_id}
            timeScale={timeScale}
            reloadKey={reloadKey}
          />
        )}

        {meter.last_updated ? (
          <p className="last-updated">
            {`Last updated: ${new Date(meter.last_updated).toLocaleString()}`}
          </p>
        ) : (
          isStale && <p className="stale-note">値がありません（データ未受信）</p>
        )}
      </div>
    </div>
  )
}
