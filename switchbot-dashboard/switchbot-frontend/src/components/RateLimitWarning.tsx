import type { StatusResponse } from '../types';

export const RateLimitWarning = ({ status }: { status?: StatusResponse }) => {
  if (!status?.is_rate_limited) {
    return null;
  }
  return (
    <div className="alert alert-warning">
      <strong>Rate Limited.</strong> SwitchBot API rate limit reached. Retry in {status.backoff_remaining} seconds.
    </div>
  );
};
