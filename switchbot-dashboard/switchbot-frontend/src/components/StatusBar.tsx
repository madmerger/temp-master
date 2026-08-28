import type { StatusResponse } from '../types';

interface StatusBarProps {
  status: StatusResponse | null;
}

export function StatusBar({ status }: StatusBarProps) {
  if (!status) {
    return null;
  }

  const count = status.meters_count || 0;
  const noun = count === 1 ? 'meter' : 'meters';
  const now = new Date();
  const refreshTime = now.toLocaleTimeString('en-US', { hour12: false });

  return (
    <>
      <div className="flex flex-col gap-1 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-200 sm:flex-row sm:items-center sm:justify-between">
        <span>Monitoring {count} {noun}</span>
        <span>Last refresh: {refreshTime}</span>
      </div>
      {status.is_rate_limited && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200">
          <strong>Rate Limited.</strong> SwitchBot API rate limit reached. Retry in {status.backoff_remaining || 0} seconds.
        </div>
      )}
    </>
  );
}
