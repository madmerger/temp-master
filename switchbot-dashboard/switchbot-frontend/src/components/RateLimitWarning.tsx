interface RateLimitWarningProps {
  backoffRemaining: number
}

export function RateLimitWarning({ backoffRemaining }: RateLimitWarningProps) {
  return (
    <div className="alert alert-warning">
      <strong>Rate Limited.</strong>{' '}
      <span>{`SwitchBot API rate limit reached. Retry in ${backoffRemaining} seconds.`}</span>
    </div>
  )
}
