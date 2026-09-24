import type { StatusResponse } from '../types';

export function RateLimitWarning({ status }: { status: StatusResponse }) {
  if (!status.is_rate_limited) return null;
  const remaining = status.backoff_remaining || 0;
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 rounded px-4 py-2 mb-4 text-sm">
      <strong>Rate Limited.</strong> SwitchBot API rate limit reached. Retry in {remaining} seconds.
    </div>
  );
}
