import type { Status } from '../types'
import { formatClock } from '../utils/format'
import styles from './StatusBar.module.css'

interface StatusBarProps {
  status: Status
  lastRefresh: Date | null
}

export function StatusBar({ status, lastRefresh }: StatusBarProps) {
  const count = status.meters_count || 0
  const noun = count === 1 ? 'meter' : 'meters'

  return (
    <div className={`${styles.alert} ${styles.info}`}>
      <span>
        Monitoring {count} {noun}
      </span>
      <span className={styles.refresh}>
        Last refresh: {formatClock(lastRefresh ?? new Date())}
      </span>
    </div>
  )
}
