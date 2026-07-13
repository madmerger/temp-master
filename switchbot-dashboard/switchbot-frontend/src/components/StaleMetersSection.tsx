import type { Meter, TimeScale } from "../api";
import type { Theme } from "../theme";
import { MeterCard } from "./MeterCard";

interface Props {
  meters: Meter[];
  timeScale: TimeScale;
  theme: Theme;
  refreshKey: number;
}

export function StaleMetersSection({ meters, timeScale, theme, refreshKey }: Props) {
  if (meters.length === 0) {
    return null;
  }
  return (
    <div className="section">
      <div className="section-header">
        <h3 className="section-title">
          <span aria-hidden="true">&#9888;</span> 未更新のメーター
        </h3>
        <p className="section-subtitle">1週間以上更新されていないデバイス</p>
      </div>
      <div className="card stale-panel">
        <div className="meter-grid">
          {meters.map((meter) => (
            <MeterCard
              key={meter.device_id}
              meter={meter}
              isStale
              timeScale={timeScale}
              theme={theme}
              refreshKey={refreshKey}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
