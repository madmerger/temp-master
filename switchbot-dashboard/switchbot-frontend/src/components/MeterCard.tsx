import { useQuery } from '@tanstack/react-query'
import { fetchHistory } from '../lib/api'
import { getDisplayName } from '../lib/displayNames'
import { MeterChart } from './MeterChart'
import type { Meter, TimeScale } from '../types'

interface MeterCardProps {
  meter: Meter
  isStale: boolean
  timeScale: TimeScale
}

export function MeterCard({ meter, isStale, timeScale }: MeterCardProps) {
  const historyQuery = useQuery({
    queryKey: ['history', meter.device_id, timeScale],
    queryFn: () => fetchHistory(meter.device_id, timeScale),
    refetchInterval: 30000,
    enabled: !isStale,
    retry: false,
  })

  return (
    <article className="panel meter-card">
      <div className="panel-heading">
        <div className="meter-panel-header">
          <div className="meter-panel-title">
            <strong>{getDisplayName(meter.device_name)}</strong>
            {isStale && <span className="label label-warning stale-meter-badge">7日以上未更新</span>}
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
          <div className="meter-chart-wrap">
            {historyQuery.data && <MeterChart history={historyQuery.data.history ?? []} timeScale={timeScale} />}
          </div>
        )}
        {meter.last_updated ? (
          <p className="meter-last-updated">Last updated: {new Date(meter.last_updated).toLocaleString()}</p>
        ) : (
          isStale && <p className="stale-meter-empty">値がありません（データ未受信）</p>
        )}
      </div>
    </article>
  )
}
