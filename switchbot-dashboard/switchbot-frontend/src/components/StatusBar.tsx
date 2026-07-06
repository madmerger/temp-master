import type { StatusResponse } from '../types';

interface StatusBarProps {
  status: StatusResponse | null;
  lastRefresh: string;
}

export function StatusBar({ status, lastRefresh }: StatusBarProps) {
  if (!status) return null;

  return (
    <>
      <div className="status-bar">
        <span>Monitoring {status.meters_count} {status.meters_count === 1 ? 'meter' : 'meters'}</span>
        <span>{lastRefresh}</span>
      </div>
      {status.is_rate_limited && (
        <div className="alert alert-warning">
          <strong>Rate Limited.</strong> SwitchBot API rate limit reached. Retry in {status.backoff_remaining} seconds.
        </div>
      )}
    </>
  );
}
