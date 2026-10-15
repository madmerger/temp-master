import type { StatusResponse } from '../types';

interface StatusBarProps {
  status: StatusResponse | undefined;
  dataUpdatedAt: number;
}

export function StatusBar({ status, dataUpdatedAt }: StatusBarProps) {
  if (!status) return null;

  const noun = status.meters_count === 1 ? 'meter' : 'meters';
  const refreshedAt = new Date(dataUpdatedAt);
  const time = [refreshedAt.getHours(), refreshedAt.getMinutes(), refreshedAt.getSeconds()]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-100">
      <span>
        Monitoring {status.meters_count} {noun}
      </span>
      <span className="sm:ml-auto">Last refresh: {time}</span>
    </div>
  );
}
