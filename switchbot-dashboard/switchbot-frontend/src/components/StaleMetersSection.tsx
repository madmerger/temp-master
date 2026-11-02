import type { Meter, TimeScale } from '../types';
import MeterCard from './MeterCard';
import styles from './StaleMetersSection.module.css';

interface StaleMetersSectionProps {
  meters: Meter[];
  timeScale: TimeScale;
  refreshTick: number;
}

export default function StaleMetersSection({
  meters,
  timeScale,
  refreshTick,
}: StaleMetersSectionProps) {
  if (meters.length === 0) {
    return null;
  }
  return (
    <section className={styles.section}>
      <header className={styles.sectionHeader}>
        <h2>⚠ 未更新のメーター</h2>
        <p>1週間以上更新されていないデバイス</p>
      </header>
      <div className={styles.panel}>
        <div className={styles.grid}>
          {meters.map((meter) => (
            <MeterCard
              key={meter.device_id}
              meter={meter}
              isStale
              timeScale={timeScale}
              refreshTick={refreshTick}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
