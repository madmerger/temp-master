import { useEffect, useState } from 'react'
import { fetchHistory } from '../api'
import { getDisplayName } from '../constants'
import type { Meter, MeterReading, TimeScale } from '../types'
import Chart from './Chart'

interface MeterPanelProps {
  meter: Meter
  isStale: boolean
  timeScale: TimeScale
  refreshTick: number
}

export default function MeterPanel({
  meter,
  isStale,
  timeScale,
  refreshTick,
}: MeterPanelProps) {
  const [history, setHistory] = useState<MeterReading[]>([])

  useEffect(() => {
    let cancelled = false

    if (isStale) {
      setHistory([])
      return () => {
        cancelled = true
      }
    }

    fetchHistory(meter.device_id, timeScale)
      .then((response) => {
        if (!cancelled) {
          setHistory(response.history || [])
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHistory([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [isStale, meter.device_id, refreshTick, timeScale])

  return (
    <div className="panel panel-default">
      <div className="panel-heading">
        <div className="meter-panel-header">
          <div className="meter-panel-title">
            <strong>{getDisplayName(meter.device_name)}</strong>
            {isStale && (
              <span className="label label-warning stale-meter-badge">7日以上未更新</span>
            )}
          </div>
          <span className="device-type-tag">{meter.device_type}</span>
        </div>
      </div>
      <div className="panel-body">
        <div className="meter-stats">
          {meter.current_temperature !== null && meter.current_temperature !== undefined && (
            <span className="label label-danger">{meter.current_temperature}°C</span>
          )}
          {meter.current_humidity !== null && meter.current_humidity !== undefined && (
            <span className="label label-info">{meter.current_humidity}%</span>
          )}
          {meter.battery !== null && meter.battery !== undefined && (
            <span className="label label-success">{meter.battery}%</span>
          )}
        </div>
        {isStale ? (
          <p className="stale-meter-empty">履歴データの取得対象外</p>
        ) : (
          <Chart history={history} timeScale={timeScale} />
        )}
        {meter.last_updated ? (
          <p className="meter-last-updated">
            Last updated: {new Date(meter.last_updated).toLocaleString()}
          </p>
        ) : (
          isStale && <p className="stale-meter-empty">値がありません（データ未受信）</p>
        )}
      </div>
    </div>
  )
}
