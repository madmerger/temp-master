interface RateLimitWarningProps {
  isRateLimited: boolean
  backoffRemaining: number
}

export function RateLimitWarning({
  isRateLimited,
  backoffRemaining,
}: RateLimitWarningProps) {
  if (!isRateLimited) {
    return null
  }

  return (
    <div className="mb-5 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
      <strong>Rate Limited.</strong>{' '}
      SwitchBot API rate limit reached. Retry in {backoffRemaining} seconds.
    </div>
  )
}
