import type { StatusResponse } from '../types';
import { formatClock } from '../lib/format';
import Alert from './Alert';
import styles from './StatusBar.module.css';

interface StatusBarProps {
  status: StatusResponse | null;
  lastRefresh: Date | null;
}

// 監視中メーター数・最終更新時刻と、レート制限警告を表示する
export default function StatusBar({ status, lastRefresh }: StatusBarProps) {
  if (!status) {
    return null;
  }
  const count = status.meters_count || 0;
  const noun = count === 1 ? 'meter' : 'meters';
  const remaining = status.backoff_remaining || 0;

  return (
    <>
      <Alert variant="info" id="status-bar">
        <div className={styles.row}>
          <span id="status-meters-count">
            Monitoring {count} {noun}
          </span>
          <span id="status-last-refresh">
            {lastRefresh ? `Last refresh: ${formatClock(lastRefresh)}` : ''}
          </span>
        </div>
      </Alert>
      {status.is_rate_limited && (
        <Alert variant="warning" id="rate-limit-warning">
          <strong>Rate Limited.</strong>{' '}
          <span id="rate-limit-text">
            SwitchBot API rate limit reached. Retry in {remaining} seconds.
          </span>
        </Alert>
      )}
    </>
  );
}
