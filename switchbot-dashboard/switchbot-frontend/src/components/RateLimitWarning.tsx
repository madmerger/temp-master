import type { StatusResponse } from "../types";

interface RateLimitWarningProps {
  status: StatusResponse | null;
}

export function RateLimitWarning({ status }: RateLimitWarningProps) {
  if (!status?.is_rate_limited) return null;

  const remaining = status.backoff_remaining;
  return (
    <div className="alert alert-warning">
      <strong>Rate Limited.</strong>{" "}
      SwitchBot API rate limit reached. Retry in {remaining} seconds.
    </div>
  );
}
