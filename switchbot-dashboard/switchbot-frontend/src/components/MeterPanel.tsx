import { getDisplayName } from '../constants'
import { TemperatureChart } from './TemperatureChart'
import type { MeterDevice, MeterReading, TimeScale } from '../types'

interface MeterPanelProps {
  meter: MeterDevice
  isStale: boolean
  history: MeterReading[]
  timeScale: TimeScale
}

export function MeterPanel({
  meter,
  isStale,
  history,
  timeScale,
}: MeterPanelProps) {
  return (
    <div className="panel">
      <div className="panel-heading">
        <div className="meter-panel-header">
          <div className="meter-panel-title">
            <span>{getDisplayName(meter.device_name)}</span>
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
          {meter.current_temperature != null && (
            <span className="label label-danger">
              {`${meter.current_temperature}\u00b0C`}
            </span>
          )}
          {meter.current_humidity != null && (
            <span className="label label-info">{`${meter.current_humidity}%`}</span>
          )}
          {meter.battery != null && (
            <span className="label label-success">{`${meter.battery}%`}</span>
          )}
        </div>

        {isStale ? (
          <p className="stale-meter-empty">履歴データの取得対象外</p>
        ) : (
          <TemperatureChart history={history} timeScale={timeScale} />
        )}

        {meter.last_updated ? (
          <p className="meter-last-updated">
            {`Last updated: ${new Date(meter.last_updated).toLocaleString()}`}
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
