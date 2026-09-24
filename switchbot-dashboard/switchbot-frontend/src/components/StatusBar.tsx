import type { Status } from '../api'
import { formatClock } from '../utils/format'

interface Props {
  status: Status | null
  lastRefresh: Date | null
}

export function StatusBar({ status, lastRefresh }: Props) {
  if (!status) return null
  const count = status.meters_count ?? 0
  return (
    <div className="alert alert-info d-flex justify-content-between" role="status">
      <span>
        Monitoring {count} {count === 1 ? 'meter' : 'meters'}
      </span>
      {lastRefresh && <span>Last refresh: {formatClock(lastRefresh)}</span>}
    </div>
  )
}
