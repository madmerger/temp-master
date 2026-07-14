import type { Meter, TimeScale } from "../types";
import { getDisplayName } from "../utils";
import { TemperatureChart } from "./TemperatureChart";

interface ActiveMeterCardProps {
  meter: Meter;
  timeScale: TimeScale;
  refreshKey: number;
  stale?: false;
}

interface StaleMeterCardProps {
  meter: Meter;
  stale: true;
}

type MeterCardProps = ActiveMeterCardProps | StaleMeterCardProps;

export function MeterCard(props: MeterCardProps) {
  const { meter } = props;
  const stale = props.stale === true;

  return (
    <article className={`meter-card card ${stale ? "stale" : ""}`}>
      <header className="meter-header">
        <div>
          <div className="meter-title-row">
            <h2>{getDisplayName(meter.device_name)}</h2>
            {stale && <span className="stale-badge">7日以上未更新</span>}
          </div>
          <span className="device-type">{meter.device_type}</span>
        </div>
        <span className={`meter-indicator ${stale ? "inactive" : ""}`} aria-hidden="true" />
      </header>

      <div className="meter-stats">
        {meter.current_temperature !== null && (
          <div className="metric temperature">
            <span className="metric-label">Temperature</span>
            <strong>{meter.current_temperature}°C</strong>
          </div>
        )}
        {meter.current_humidity !== null && (
          <div className="metric humidity">
            <span className="metric-label">Humidity</span>
            <strong>{meter.current_humidity}%</strong>
          </div>
        )}
        {meter.battery !== null && (
          <div className="metric battery">
            <span className="metric-label">Battery</span>
            <strong>{meter.battery}%</strong>
          </div>
        )}
      </div>

      {stale ? (
        <div className="stale-message">
          <strong>履歴データの取得対象外</strong>
          {!meter.last_updated && <span>値がありません（データ未受信）</span>}
        </div>
      ) : (
        <TemperatureChart
          deviceId={meter.device_id}
          timeScale={props.timeScale}
          refreshKey={props.refreshKey}
        />
      )}

      {meter.last_updated && (
        <p className="last-updated">Last updated: {new Date(meter.last_updated).toLocaleString()}</p>
      )}
    </article>
  );
}
