import { useQuery } from '@tanstack/react-query'
import { fetchHistory } from '../api/client'
import type { Meter, TimeScale } from '../api/types'
import { getDisplayName, isStaleMeter } from '../utils/meter'
import { TemperatureChart } from './TemperatureChart'

export function MeterCard({ meter, timeScale }: { meter: Meter; timeScale: TimeScale }) {
  const stale = isStaleMeter(meter)
  const history = useQuery({ queryKey: ['history', meter.device_id, timeScale], queryFn: () => fetchHistory(meter.device_id, timeScale), enabled: !stale, staleTime: 25_000 })
  return <article className={`meter-card${stale ? ' stale-card' : ''}`}>
    <header><div><h3>{getDisplayName(meter.device_name)}</h3>{stale && <span className="stale-badge">7日以上未更新</span>}</div><span className="device-type">{meter.device_type}</span></header>
    <div className="stats">
      {meter.current_temperature != null && <span className="stat temperature">{meter.current_temperature}°C</span>}
      {meter.current_humidity != null && <span className="stat humidity">{meter.current_humidity}%</span>}
      {meter.battery != null && <span className="stat battery">{meter.battery}%</span>}
    </div>
    {stale ? <p className="stale-message">履歴データの取得対象外</p> : history.isLoading ? <div className="chart-placeholder">Loading history...</div> : <TemperatureChart history={history.data?.history || []} timeScale={timeScale} />}
    {meter.last_updated ? <p className="last-updated">Last updated: {new Date(meter.last_updated).toLocaleString()}</p> : stale && <p className="stale-message">値がありません（データ未受信）</p>}
  </article>
}
