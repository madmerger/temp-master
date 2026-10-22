import type { Meter, TimeScale } from '../types';
import MeterGrid from './MeterGrid';
import styles from './StaleMetersSection.module.css';

interface StaleMetersSectionProps {
  meters: Meter[];
  timeScale: TimeScale;
  reloadKey: number;
}

// 7日以上更新されていないメーターをまとめて表示するセクション
export default function StaleMetersSection({
  meters,
  timeScale,
  reloadKey,
}: StaleMetersSectionProps) {
  if (meters.length === 0) {
    return null;
  }
  return (
    <section className={styles.section} data-testid="stale-meters-section">
      <div className={styles.header}>
        <h3 className={styles.title}>
          <span aria-hidden="true" className={styles.icon}>
            {'\u26a0'}
          </span>{' '}
          未更新のメーター
        </h3>
        <p className={styles.subtitle}>1週間以上更新されていないデバイス</p>
      </div>
      <div className={styles.panel}>
        <div className={styles.body}>
          <MeterGrid meters={meters} isStale timeScale={timeScale} reloadKey={reloadKey} />
        </div>
      </div>
    </section>
  );
}
