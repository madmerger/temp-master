import type { StatusResponse } from '../types'
import { formatClock } from '../utils/format'
import styles from './StatusBar.module.css'

interface StatusBarProps {
  status: StatusResponse | null
  lastRefresh: Date | null
  error: string | null
}

export default function StatusBar({ status, lastRefresh, error }: StatusBarProps) {
  return (
    <>
      {error && (
        <div className={styles.error}>
          <strong>Error.</strong> {error}
        </div>
      )}

      {status && (
        <div className={styles.bar}>
          <span>
            Monitoring {status.meters_count}{' '}
            {status.meters_count === 1 ? 'meter' : 'meters'}
          </span>
          {lastRefresh && <span>Last refresh: {formatClock(lastRefresh)}</span>}
        </div>
      )}

      {status?.is_rate_limited && (
        <div className={styles.warning}>
          <strong>Rate Limited.</strong> SwitchBot API rate limit reached. Retry in{' '}
          {status.backoff_remaining} seconds.
        </div>
      )}
    </>
  )
}
