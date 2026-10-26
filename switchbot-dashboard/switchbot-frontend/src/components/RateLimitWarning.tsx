interface RateLimitWarningProps {
  remaining: number
}

export function RateLimitWarning({ remaining }: RateLimitWarningProps) {
  return (
    <div id="rate-limit-warning" className="mb-5 rounded border border-alert-warning-border bg-alert-warning-bg px-4 py-3 text-sm text-alert-warning-text">
      <strong>Rate Limited.</strong> SwitchBot API rate limit reached. Retry in {remaining} seconds.
    </div>
  )
}
