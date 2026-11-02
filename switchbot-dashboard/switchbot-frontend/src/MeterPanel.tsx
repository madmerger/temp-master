import { getDisplayName } from './displayNames';
import { MeterChart } from './MeterChart';
import type { Meter, TimeScale } from './types';
import { isStaleMeter } from './utils';

interface MeterPanelProps {
  meter: Meter;
  timeScale: TimeScale;
  reloadToken: number;
}

export function MeterPanel({ meter, timeScale, reloadToken }: MeterPanelProps) {
  const stale = isStaleMeter(meter);

  return (
    <article className={`meter-panel${stale ? ' meter-panel-stale' : ''}`}>
      <header className="meter-panel-heading">
        <div className="meter-panel-title">
          <strong>{getDisplayName(meter.device_name)}</strong>
          {stale && <span className="badge badge-warning">7日以上未更新</span>}
        </div>
        <span className="device-type-tag">{meter.device_type}</span>
      </header>
      <div className="meter-panel-body">
        <div className="meter-stats">
          {meter.current_temperature !== null &&
            meter.current_temperature !== undefined && (
              <span className="label label-danger">
                {meter.current_temperature}°C
              </span>
            )}
          {meter.current_humidity !== null && meter.current_humidity !== undefined && (
            <span className="label label-info">{meter.current_humidity}%</span>
          )}
          {meter.battery !== null && meter.battery !== undefined && (
            <span className="label label-success">{meter.battery}%</span>
          )}
        </div>
        {stale ? (
          <p className="stale-meter-empty">履歴データの取得対象外</p>
        ) : (
          <div className="meter-chart-wrap">
            <MeterChart
              deviceId={meter.device_id}
              timeScale={timeScale}
              reloadToken={reloadToken}
            />
          </div>
        )}
        {meter.last_updated ? (
          <p className="meter-last-updated">
            Last updated: {new Date(meter.last_updated).toLocaleString()}
          </p>
        ) : (
          stale && <p className="stale-meter-empty">値がありません（データ未受信）</p>
        )}
      </div>
    </article>
  );
}
