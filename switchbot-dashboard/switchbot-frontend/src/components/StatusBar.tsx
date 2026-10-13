import { formatClock } from '../lib/format'
import type { StatusResponse } from '../types'

interface StatusBarProps {
  status: StatusResponse
  dataUpdatedAt: number
}

export function StatusBar({ status, dataUpdatedAt }: StatusBarProps) {
  const count = status.meters_count || 0
  const noun = count === 1 ? 'meter' : 'meters'

  return (
    <div className="alert alert-info status-bar">
      <span>Monitoring {count} {noun}</span>
      <span className="status-last-refresh">Last refresh: {formatClock(new Date(dataUpdatedAt))}</span>
    </div>
  )
}
