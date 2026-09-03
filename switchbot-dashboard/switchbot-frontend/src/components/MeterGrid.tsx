import type { Meter, TimeScale } from '../api/types';
import MeterCard from './MeterCard';
import styles from './MeterGrid.module.css';

interface MeterGridProps {
  meters: Meter[];
  timeScale: TimeScale;
  isStale?: boolean;
}

export default function MeterGrid({ meters, timeScale, isStale = false }: MeterGridProps) {
  return (
    <div className={styles.grid}>
      {meters.map((meter) => (
        <MeterCard key={meter.device_id} meter={meter} isStale={isStale} timeScale={timeScale} />
      ))}
    </div>
  );
}
