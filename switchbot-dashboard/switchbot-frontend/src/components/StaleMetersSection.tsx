import type { Meter, TimeScale } from "../types";
import { MeterCard } from "./MeterCard";

interface StaleMetersSectionProps {
  meters: Meter[];
  timeScale: TimeScale;
  refreshKey: number;
}

export function StaleMetersSection({
  meters,
  timeScale,
  refreshKey,
}: StaleMetersSectionProps) {
  if (meters.length === 0) {
    return null;
  }

  return (
    <section className="stale-section">
      <div className="section-heading">
        <span className="warning-mark" aria-hidden="true">
          !
        </span>
        <div>
          <h2>未更新のメーター</h2>
          <p>1週間以上更新されていないデバイス</p>
        </div>
      </div>
      <div className="meter-grid stale-grid">
        {meters.map((meter) => (
          <MeterCard
            key={meter.device_id}
            meter={meter}
            timeScale={timeScale}
            refreshKey={refreshKey}
            stale
          />
        ))}
      </div>
    </section>
  );
}
