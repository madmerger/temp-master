import type { StatusResponse } from '../types';
import { formatTime } from '../utils';
import styles from './StatusBar.module.css';

interface StatusBarProps {
  status: StatusResponse | null;
  lastRefresh: Date | null;
}

export function StatusBar({ status, lastRefresh }: StatusBarProps) {
  if (!status) return null;

  const count = status.meters_count;
  const noun = count === 1 ? 'meter' : 'meters';

  return (
    <>
      <div className={styles.bar}>
        <span>Monitoring {count} {noun}</span>
        {lastRefresh && (
          <span className={styles.time}>Last refresh: {formatTime(lastRefresh)}</span>
        )}
      </div>
      {status.is_rate_limited && (
        <div className={styles.warning}>
          <strong>Rate Limited.</strong>{' '}
          SwitchBot API rate limit reached. Retry in {status.backoff_remaining} seconds.
        </div>
      )}
    </>
  );
}
