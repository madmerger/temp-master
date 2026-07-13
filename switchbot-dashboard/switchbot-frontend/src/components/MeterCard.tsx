import type { Meter, TimeScale } from "../api";
import { getDisplayName } from "../constants";
import { useHistory } from "../hooks";
import type { Theme } from "../theme";
import { TemperatureChart } from "./TemperatureChart";

interface Props {
  meter: Meter;
  isStale: boolean;
  timeScale: TimeScale;
  theme: Theme;
  refreshKey: number;
}

export function MeterCard({ meter, isStale, timeScale, theme, refreshKey }: Props) {
  const { history } = useHistory(meter.device_id, timeScale, !isStale, refreshKey);

  const hasTemp =
    meter.current_temperature !== null && meter.current_temperature !== undefined;
  const hasHumidity =
    meter.current_humidity !== null && meter.current_humidity !== undefined;
  const hasBattery = meter.battery !== null && meter.battery !== undefined;

  return (
    <div className="card meter-card">
      <div className="meter-card-header">
        <div className="meter-title">
          <span>{getDisplayName(meter.device_name)}</span>
          {isStale && <span className="badge badge-stale">7日以上未更新</span>}
        </div>
        <span className="device-type-tag">{meter.device_type}</span>
      </div>

      <div className="badges">
        {hasTemp && (
          <span className="badge badge-temp">{meter.current_temperature}&#176;C</span>
        )}
        {hasHumidity && (
          <span className="badge badge-humidity">{meter.current_humidity}%</span>
        )}
        {hasBattery && (
          <span className="badge badge-battery">{meter.battery}%</span>
        )}
      </div>

      {isStale ? (
        <p className="stale-note">履歴データの取得対象外</p>
      ) : (
        <div className="meter-chart-wrap">
          <TemperatureChart history={history} timeScale={timeScale} theme={theme} />
        </div>
      )}

      {meter.last_updated ? (
        <p className="meter-last-updated">
          Last updated: {new Date(meter.last_updated).toLocaleString()}
        </p>
      ) : (
        isStale && <p className="stale-note">値がありません（データ未受信）</p>
      )}
    </div>
  );
}
