import { getDisplayName } from '../meters'
import { TemperatureChart } from './TemperatureChart'
import type { Meter, TimeScale } from '../types'

interface Props {
  meter: Meter
  timeScale: TimeScale
  isStale: boolean
  refreshKey?: number
}

export function MeterCard({ meter, timeScale, isStale, refreshKey = 0 }: Props) {
  const name = getDisplayName(meter.device_name)
  const hasTemp =
    meter.current_temperature !== null && meter.current_temperature !== undefined
  const hasHumidity =
    meter.current_humidity !== null && meter.current_humidity !== undefined
  const hasBattery = meter.battery !== null && meter.battery !== undefined

  return (
    <div className="panel">
      <div className="panel-heading">
        <div className="meter-panel-header">
          <div className="meter-panel-title">
            <strong>{name}</strong>
            {isStale && (
              <span className="label label-warning stale-meter-badge">
                7日以上未更新
              </span>
            )}
          </div>
          <span className="device-type-tag">{meter.device_type}</span>
        </div>
      </div>
      <div className="panel-body">
        <div className="meter-stats">
          {hasTemp && (
            <span className="label label-danger">
              {meter.current_temperature}&deg;C
            </span>
          )}
          {hasHumidity && (
            <span className="label label-info">{meter.current_humidity}%</span>
          )}
          {hasBattery && (
            <span className="label label-success">{meter.battery}%</span>
          )}
        </div>

        {isStale ? (
          <p className="stale-meter-empty">履歴データの取得対象外</p>
        ) : (
          <TemperatureChart
            deviceId={meter.device_id}
            timeScale={timeScale}
            refreshKey={refreshKey}
          />
        )}

        {meter.last_updated ? (
          <p className="meter-last-updated">
            Last updated: {new Date(meter.last_updated).toLocaleString()}
          </p>
        ) : (
          isStale && (
            <p className="stale-meter-empty">値がありません（データ未受信）</p>
          )
        )}
      </div>
    </div>
  )
}
