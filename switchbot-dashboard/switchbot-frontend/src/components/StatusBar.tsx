import type { StatusResponse } from '../api/types';
import styles from './StatusBar.module.css';

interface StatusBarProps {
  status: StatusResponse;
  dataUpdatedAt: number;
}

export default function StatusBar({ status, dataUpdatedAt }: StatusBarProps) {
  const refreshTime = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '--:--:--';
  const noun = status.meters_count === 1 ? 'meter' : 'meters';

  return (
    <>
      <div className={styles.infoAlert}>
        <span>Monitoring {status.meters_count} {noun}</span>
        <span>Last refresh: {refreshTime}</span>
      </div>
      {status.is_rate_limited && (
        <div className={styles.warningAlert}>
          <strong>Rate Limited.</strong> SwitchBot API rate limit reached. Retry in {status.backoff_remaining} seconds.
        </div>
      )}
    </>
  );
}
