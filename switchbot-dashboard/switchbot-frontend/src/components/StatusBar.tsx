import { pad2 } from '../utils';
import type { StatusResponse } from '../types';

interface StatusBarProps {
  status: StatusResponse;
  lastRefresh: Date | null;
}

export function StatusBar({ status, lastRefresh }: StatusBarProps) {
  const count = status.meters_count || 0;
  const noun = count === 1 ? 'meter' : 'meters';
  const now = lastRefresh ?? new Date();
  const refreshText = `Last refresh: ${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;

  return (
    <div className="flex justify-between bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 rounded px-4 py-2 mb-4 text-sm">
      <span>
        Monitoring {count} {noun}
      </span>
      <span>{refreshText}</span>
    </div>
  );
}
