import type { StatusResponse } from '../types';

interface RateLimitWarningProps {
  status: StatusResponse | undefined;
}

export function RateLimitWarning({ status }: RateLimitWarningProps) {
  if (!status?.is_rate_limited) return null;

  return (
    <div
      role="status"
      className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-100"
    >
      <strong className="font-semibold">Rate Limited.</strong>{' '}
      <span>SwitchBot API rate limit reached. Retry in {status.backoff_remaining || 0} seconds.</span>
    </div>
  );
}
