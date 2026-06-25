import type { StatusResponse } from '../types';

interface StatusBarProps {
  status: StatusResponse | null;
  lastRefreshTime: Date | null;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function StatusBar({ status, lastRefreshTime }: StatusBarProps) {
  if (!status) return null;

  const noun = status.meters_count === 1 ? 'meter' : 'meters';
  const refreshText = lastRefreshTime
    ? `Last refresh: ${pad2(lastRefreshTime.getHours())}:${pad2(lastRefreshTime.getMinutes())}:${pad2(lastRefreshTime.getSeconds())}`
    : '';

  return (
    <>
      <div className="alert alert-info">
        <span>Monitoring {status.meters_count} {noun}</span>
        {refreshText && <span className="alert-right">{refreshText}</span>}
      </div>

      {status.is_rate_limited && (
        <div className="alert alert-warning">
          <strong>Rate Limited.</strong>{' '}
          SwitchBot API rate limit reached. Retry in {status.backoff_remaining} seconds.
        </div>
      )}
    </>
  );
}
