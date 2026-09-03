import { MeterPanel } from './MeterPanel';
import type { Meter, TimeScale } from '../types';

export const StaleMetersSection = ({ meters, timeScale }: { meters: Meter[]; timeScale: TimeScale }) => {
  if (!meters.length) {
    return null;
  }
  return (
    <section className="meter-section">
      <div className="meter-section-header">
        <h3 className="meter-section-title">⚠ 未更新のメーター</h3>
        <p className="meter-section-subtitle">1週間以上更新されていないデバイス</p>
      </div>
      <div className="panel stale-meters-panel">
        <div className="panel-body">
          <div className="meter-grid">
            {meters.map((meter) => (
              <MeterPanel key={meter.device_id} meter={meter} isStale timeScale={timeScale} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
