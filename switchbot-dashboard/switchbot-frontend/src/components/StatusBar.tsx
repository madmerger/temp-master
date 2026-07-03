import type { StatusResponse } from '../api/types'

interface StatusBarProps {
  status: StatusResponse | null
  lastRefresh: Date | null
}

function pad2(n: number): string {
  return n < 10 ? '0' + n : '' + n
}

export function StatusBar({ status, lastRefresh }: StatusBarProps) {
  if (!status) return null

  const count = status.meters_count
  const noun = count === 1 ? 'meter' : 'meters'
  const refreshText = lastRefresh
    ? `Last refresh: ${pad2(lastRefresh.getHours())}:${pad2(lastRefresh.getMinutes())}:${pad2(lastRefresh.getSeconds())}`
    : ''

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 [.high-contrast_&]:bg-[#002244] [.high-contrast_&]:text-cyan-300">
        <span>Monitoring {count} {noun}</span>
        <span>{refreshText}</span>
      </div>
      {status.is_rate_limited && (
        <div className="rounded-lg bg-yellow-50 px-4 py-2 text-sm text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 [.high-contrast_&]:bg-[#332200] [.high-contrast_&]:text-yellow-300">
          <strong>Rate Limited.</strong> SwitchBot API rate limit reached.
          {status.backoff_remaining > 0 &&
            ` Retry in ${status.backoff_remaining} seconds.`}
        </div>
      )}
    </div>
  )
}
