import type { StatusResponse } from "../api";

interface Props {
  status: StatusResponse | null;
}

export function RateLimitWarning({ status }: Props) {
  if (!status || !status.is_rate_limited) {
    return null;
  }
  const remaining = status.backoff_remaining || 0;
  return (
    <div className="alert alert-warning">
      <strong>Rate Limited.</strong>{" "}
      SwitchBot API rate limit reached. Retry in {remaining} seconds.
    </div>
  );
}
