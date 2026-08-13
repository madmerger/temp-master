export function RateLimitWarning({ seconds }: { seconds: number }) {
  return <div className="warning"><strong>Rate Limited.</strong> SwitchBot API rate limit reached. Retry in {seconds} seconds.</div>
}
