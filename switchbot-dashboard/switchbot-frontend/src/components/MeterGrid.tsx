import type { Meter, TimeScale } from '../types';
import MeterPanel from './MeterPanel';
import styles from './MeterGrid.module.css';

interface MeterGridProps {
  meters: Meter[];
  isStale: boolean;
  timeScale: TimeScale;
  reloadKey: number;
}

// メーターパネルのレスポンシブグリッド（広い画面で3列・中間で2列・狭い画面で1列）
export default function MeterGrid({ meters, isStale, timeScale, reloadKey }: MeterGridProps) {
  if (meters.length === 0) {
    return null;
  }
  return (
    <div className={styles.row}>
      {meters.map((meter) => (
        <div className={styles.col} key={meter.device_id}>
          <MeterPanel meter={meter} isStale={isStale} timeScale={timeScale} reloadKey={reloadKey} />
        </div>
      ))}
    </div>
  );
}
