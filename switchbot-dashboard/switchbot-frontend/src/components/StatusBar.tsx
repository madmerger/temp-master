import { formatClock } from '../lib/format';
import type { StatusResponse } from '../types';

export const StatusBar = ({ status, lastRefresh }: { status?: StatusResponse; lastRefresh: Date | null }) => {
  if (!status) {
    return null;
  }
  const count = status.meters_count || 0;
  return (
    <div className="alert alert-info status-bar">
      <span>Monitoring {count} {count === 1 ? 'meter' : 'meters'}</span>
      {lastRefresh && <span>Last refresh: {formatClock(lastRefresh)}</span>}
    </div>
  );
};
