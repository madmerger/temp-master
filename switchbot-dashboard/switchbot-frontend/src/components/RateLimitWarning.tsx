import type { StatusResponse } from '../types'

export function RateLimitWarning({ status }: { status: StatusResponse }) {
  if (!status.is_rate_limited) {
    return null
  }

  const remaining = status.backoff_remaining || 0
  return (
    <div className="alert alert-warning">
      <strong>Rate Limited.</strong>{' '}
      <span>SwitchBot API rate limit reached. Retry in {remaining} seconds.</span>
    </div>
  )
}
