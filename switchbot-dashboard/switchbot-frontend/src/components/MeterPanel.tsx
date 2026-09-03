import { getDisplayName } from '../lib/displayNames';
import { MeterChart } from './MeterChart';
import type { Meter, TimeScale } from '../types';

export const MeterPanel = ({ meter, isStale, timeScale }: { meter: Meter; isStale: boolean; timeScale: TimeScale }) => (
  <article className="panel meter-panel">
    <div className="panel-heading meter-panel-header">
      <div className="meter-panel-title">
        <strong>{getDisplayName(meter.device_name)}</strong>
        {isStale && <span className="badge badge-warning stale-meter-badge">7日以上未更新</span>}
      </div>
      <span className="device-type-tag">{meter.device_type}</span>
    </div>
    <div className="panel-body">
      <div className="meter-stats">
        {meter.current_temperature !== null && meter.current_temperature !== undefined && (
          <span className="badge badge-danger">{meter.current_temperature}°C</span>
        )}
        {meter.current_humidity !== null && meter.current_humidity !== undefined && (
          <span className="badge badge-info">{meter.current_humidity}%</span>
        )}
        {meter.battery !== null && meter.battery !== undefined && (
          <span className="badge badge-success">{meter.battery}%</span>
        )}
      </div>
      {isStale ? (
        <p className="stale-meter-empty">履歴データの取得対象外</p>
      ) : (
        <MeterChart deviceId={meter.device_id} timeScale={timeScale} />
      )}
      {meter.last_updated ? (
        <p className="meter-last-updated">Last updated: {new Date(meter.last_updated).toLocaleString()}</p>
      ) : isStale ? (
        <p className="stale-meter-empty">値がありません（データ未受信）</p>
      ) : null}
    </div>
  </article>
);
