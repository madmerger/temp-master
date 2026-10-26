import type { StatusResponse } from '../types'
import { pad2 } from '../utils'

interface StatusBarProps {
  status: StatusResponse | null
  lastRefresh: Date | null
}

export function StatusBar({ status, lastRefresh }: StatusBarProps) {
  if (!status) {
    return null
  }

  const count = status.meters_count || 0
  const noun = count === 1 ? 'meter' : 'meters'
  const refreshText = lastRefresh
    ? `Last refresh: ${pad2(lastRefresh.getHours())}:${pad2(lastRefresh.getMinutes())}:${pad2(lastRefresh.getSeconds())}`
    : ''

  return (
    <div id="status-bar" className="mb-5 flex flex-wrap justify-between gap-2 rounded border border-alert-info-border bg-alert-info-bg px-4 py-3 text-sm text-alert-info-text">
      <span>Monitoring {count} {noun}</span>
      <span>{refreshText}</span>
    </div>
  )
}
