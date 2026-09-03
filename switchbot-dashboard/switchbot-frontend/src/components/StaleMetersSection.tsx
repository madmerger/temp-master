import type { Meter, TimeScale } from '../api/types';
import MeterGrid from './MeterGrid';
import styles from './StaleMetersSection.module.css';

interface StaleMetersSectionProps {
  meters: Meter[];
  timeScale: TimeScale;
}

export default function StaleMetersSection({ meters, timeScale }: StaleMetersSectionProps) {
  if (!meters.length) {
    return null;
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h3>⚠ 未更新のメーター</h3>
        <p>1週間以上更新されていないデバイス</p>
      </div>
      <div className={styles.panel}>
        <MeterGrid meters={meters} timeScale={timeScale} isStale />
      </div>
    </section>
  );
}
