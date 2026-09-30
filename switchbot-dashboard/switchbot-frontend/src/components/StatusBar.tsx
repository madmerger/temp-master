import { formatClock } from '../meters';
import type { Status } from '../types';

interface StatusBarProps {
  status: Status;
  lastRefresh: Date | null;
}

export default function StatusBar({ status, lastRefresh }: StatusBarProps) {
  const count = status.meters_count || 0;
  const noun = count === 1 ? 'meter' : 'meters';

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-200">
      <span>
        Monitoring {count} {noun}
      </span>
      {lastRefresh && <span>Last refresh: {formatClock(lastRefresh)}</span>}
    </div>
  );
}
