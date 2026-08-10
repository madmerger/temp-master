interface RateLimitWarningProps {
  remaining: number
}

export default function RateLimitWarning({ remaining }: RateLimitWarningProps) {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 text-yellow-900 dark:text-yellow-100 px-4 py-3 rounded mb-4">
      <strong>Rate Limited.</strong>{' '}
      <span>
        SwitchBot API rate limit reached. Retry in {remaining} seconds.
      </span>
    </div>
  )
}
