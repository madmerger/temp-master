import { formatClockTime } from '../utils/format'
import type { StatusResponse } from '../types'

interface StatusBarProps {
  status: StatusResponse
  lastRefresh: Date | null
}

export function StatusBar({ status, lastRefresh }: StatusBarProps) {
  const count = status.meters_count ?? 0
  const noun = count === 1 ? 'meter' : 'meters'

  return (
    <div className="alert alert-info">
      <span>{`Monitoring ${count} ${noun}`}</span>
      <span>
        {lastRefresh ? `Last refresh: ${formatClockTime(lastRefresh)}` : ''}
      </span>
    </div>
  )
}
