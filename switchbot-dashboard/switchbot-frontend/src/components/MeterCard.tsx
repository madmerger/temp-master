import type { Meter, TimeScale } from '../api/types';
import { getDisplayName } from '../utils/displayNames';
import TemperatureChart from './TemperatureChart';
import styles from './MeterCard.module.css';

interface MeterCardProps {
  meter: Meter;
  isStale: boolean;
  timeScale: TimeScale;
}

export default function MeterCard({ meter, isStale, timeScale }: MeterCardProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.heading}>
        <div className={styles.title}>
          <strong>{getDisplayName(meter.device_name)}</strong>
          {isStale && <span className={styles.staleBadge}>7日以上未更新</span>}
        </div>
        <span className={styles.deviceType}>{meter.device_type}</span>
      </div>
      <div className={styles.body}>
        <div className={styles.stats}>
          {meter.current_temperature !== null && (
            <span className={`${styles.label} ${styles.danger}`}>{meter.current_temperature}°C</span>
          )}
          {meter.current_humidity !== null && (
            <span className={`${styles.label} ${styles.info}`}>{meter.current_humidity}%</span>
          )}
          {meter.battery !== null && <span className={`${styles.label} ${styles.success}`}>{meter.battery}%</span>}
        </div>
        {isStale ? (
          <p className={styles.staleEmpty}>履歴データの取得対象外</p>
        ) : (
          <div className={styles.chartWrap}>
            <TemperatureChart deviceId={meter.device_id} timeScale={timeScale} />
          </div>
        )}
        {meter.last_updated ? (
          <p className={styles.lastUpdated}>Last updated: {new Date(meter.last_updated).toLocaleString()}</p>
        ) : (
          isStale && <p className={styles.staleEmpty}>値がありません（データ未受信）</p>
        )}
      </div>
    </div>
  );
}
