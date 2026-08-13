export function RateLimitWarning({ seconds }: { seconds: number }) {
  return (
    <div className="mt-4 flex gap-1 rounded-lg bg-warning px-4 py-3 text-warning-ink">
      <strong>Rate Limited.</strong>
      <span>
        SwitchBot API rate limit reached. Retry in {seconds} seconds.
      </span>
    </div>
  )
}
