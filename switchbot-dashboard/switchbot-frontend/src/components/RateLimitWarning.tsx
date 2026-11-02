import type { Status } from '../types';
import styles from './RateLimitWarning.module.css';

export default function RateLimitWarning({ status }: { status: Status | null }) {
  if (!status?.is_rate_limited) {
    return null;
  }
  return (
    <div className={styles.warning} role="status">
      <strong>Rate Limited.</strong> SwitchBot API rate limit reached. Retry in{' '}
      {status.backoff_remaining || 0} seconds.
    </div>
  );
}
