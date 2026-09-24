import type { Meter, TimeScale } from '../api'
import { getDisplayName } from '../utils/displayNames'
import { TemperatureChart } from './TemperatureChart'

interface Props {
  meter: Meter
  isStale: boolean
  timeScale: TimeScale
  refreshKey: number
}

function isSet<T>(v: T | null | undefined): v is T {
  return v !== null && v !== undefined
}

export function MeterCard({ meter, isStale, timeScale, refreshKey }: Props) {
  return (
    <div className="card meter-card">
      <div className="card-header meter-panel-header">
        <div className="meter-panel-title">
          <strong>{getDisplayName(meter.device_name)}</strong>
          {isStale && <span className="badge text-bg-warning stale-meter-badge">7日以上未更新</span>}
        </div>
        <span className="device-type-tag">{meter.device_type}</span>
      </div>
      <div className="card-body">
        <div className="meter-stats">
          {isSet(meter.current_temperature) && (
            <span className="badge text-bg-danger">{meter.current_temperature}&deg;C</span>
          )}
          {isSet(meter.current_humidity) && (
            <span className="badge text-bg-info">{meter.current_humidity}%</span>
          )}
          {isSet(meter.battery) && <span className="badge text-bg-success">{meter.battery}%</span>}
        </div>

        {isStale ? (
          <p className="stale-meter-empty">履歴データの取得対象外</p>
        ) : (
          <TemperatureChart deviceId={meter.device_id} timeScale={timeScale} refreshKey={refreshKey} />
        )}

        {meter.last_updated ? (
          <p className="meter-last-updated">Last updated: {new Date(meter.last_updated).toLocaleString()}</p>
        ) : (
          isStale && <p className="stale-meter-empty">値がありません（データ未受信）</p>
        )}
      </div>
    </div>
  )
}
