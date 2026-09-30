interface RateLimitWarningProps {
  remaining: number
}

export default function RateLimitWarning({ remaining }: RateLimitWarningProps) {
  return (
    <div data-testid="rate-limit-warning" className="mb-4 rounded border border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
      <strong>Rate Limited.</strong>{' '}
      SwitchBot API rate limit reached. Retry in {remaining || 0} seconds.
    </div>
  )
}
