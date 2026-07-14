import type { Status } from '../types'

export function RateLimitWarning({ status }: { status: Status | null }) {
  if (!status || !status.is_rate_limited) {
    return null
  }
  const remaining = status.backoff_remaining || 0
  return (
    <div className="alert warn">
      <span>
        <strong>Rate Limited. </strong>
        {`SwitchBot API rate limit reached. Retry in ${remaining} seconds.`}
      </span>
    </div>
  )
}
