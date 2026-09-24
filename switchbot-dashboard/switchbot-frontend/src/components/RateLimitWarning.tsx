import type { Status } from '../api'

interface Props {
  status: Status | null
}

export function RateLimitWarning({ status }: Props) {
  if (!status?.is_rate_limited) return null
  return (
    <div className="alert alert-warning" role="alert">
      <strong>Rate Limited.</strong> SwitchBot API rate limit reached. Retry in{' '}
      {status.backoff_remaining ?? 0} seconds.
    </div>
  )
}
