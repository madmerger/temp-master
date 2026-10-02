import type { StatusResponse } from '../types'
import { formatClockTime } from '../utils'

interface StatusBarProps {
  status: StatusResponse | null
  lastRefresh: Date | null
}

export default function StatusBar({ status, lastRefresh }: StatusBarProps) {
  if (!status) {
    return null
  }

  const count = status.meters_count || 0
  const noun = count === 1 ? 'meter' : 'meters'

  return (
    <>
      <div
        id="status-bar"
        className="mb-5 flex justify-between rounded border border-[#bce8f1] bg-[#d9edf7] px-4 py-3 text-[#31708f]"
      >
        <span id="status-meters-count">
          Monitoring {count} {noun}
        </span>
        {lastRefresh && <span id="status-last-refresh">Last refresh: {formatClockTime(lastRefresh)}</span>}
      </div>
      {status.is_rate_limited && (
        <div
          id="rate-limit-warning"
          className="mb-5 rounded border border-[#faebcc] bg-[#fcf8e3] px-4 py-3 text-[#8a6d3b]"
        >
          <strong>Rate Limited.</strong>{' '}
          <span id="rate-limit-text">
            SwitchBot API rate limit reached. Retry in {status.backoff_remaining || 0} seconds.
          </span>
        </div>
      )}
    </>
  )
}
