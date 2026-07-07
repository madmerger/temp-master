import { getDisplayName } from '../constants';
import type { TimeScale } from '../constants';
import type { MeterDevice } from '../types';
import { MeterChart } from './MeterChart';
import styles from './MeterPanel.module.css';

interface MeterPanelProps {
  meter: MeterDevice;
  timeScale: TimeScale;
}

export function MeterPanel({ meter, timeScale }: MeterPanelProps) {
  const displayName = getDisplayName(meter.device_name);

  return (
    <div className={styles.panel}>
      <div className={styles.heading}>
        <div className={styles.header}>
          <strong>{displayName}</strong>
          <span className={styles.deviceTypeTag}>{meter.device_type}</span>
        </div>
      </div>
      <div className={styles.body}>
        <div className={styles.stats}>
          {meter.current_temperature != null && (
            <span className={styles.labelDanger}>{meter.current_temperature}&deg;C</span>
          )}
          {meter.current_humidity != null && (
            <span className={styles.labelInfo}>{meter.current_humidity}%</span>
          )}
          {meter.battery != null && (
            <span className={styles.labelSuccess}>{meter.battery}%</span>
          )}
        </div>
        <MeterChart deviceId={meter.device_id} timeScale={timeScale} />
        {meter.last_updated && (
          <p className={styles.lastUpdated}>
            Last updated: {new Date(meter.last_updated).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
}
