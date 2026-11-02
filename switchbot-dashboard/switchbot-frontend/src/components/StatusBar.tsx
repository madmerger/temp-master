import type { Status } from '../types';
import { pad2 } from '../utils/format';
import styles from './StatusBar.module.css';

interface StatusBarProps {
  status: Status | null;
  lastRefresh: Date | null;
}

export default function StatusBar({ status, lastRefresh }: StatusBarProps) {
  if (!status) {
    return null;
  }
  const count = status.meters_count || 0;
  const noun = count === 1 ? 'meter' : 'meters';
  const time = lastRefresh
    ? `${pad2(lastRefresh.getHours())}:${pad2(lastRefresh.getMinutes())}:${pad2(lastRefresh.getSeconds())}`
    : '';

  return (
    <div className={styles.statusBar}>
      <span>
        Monitoring {count} {noun}
      </span>
      {time && <span>Last refresh: {time}</span>}
    </div>
  );
}
