export default function RateLimitWarning({ remaining }: { remaining: number }) {
  return <div className="mb-5 rounded border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-900 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-200"><strong>Rate Limited.</strong> SwitchBot API rate limit reached. Retry in {remaining} seconds.</div>;
}
