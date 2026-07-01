import type { StatusResponse } from "../api/meters";

interface StatusBarProps {
  status: StatusResponse | null;
  lastRefreshed: Date | null;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function StatusBar({ status, lastRefreshed }: StatusBarProps) {
  if (!status) return null;

  const time = lastRefreshed ?? new Date();
  const refreshText = `Last refresh: ${pad2(time.getHours())}:${pad2(time.getMinutes())}:${pad2(time.getSeconds())}`;
  const noun = status.meters_count === 1 ? "meter" : "meters";

  return (
    <>
      <div className="alert alert-info">
        <span>
          Monitoring {status.meters_count} {noun}
        </span>
        <span className="pull-right">{refreshText}</span>
      </div>
      {status.is_rate_limited && (
        <div className="alert alert-warning">
          <strong>Rate Limited.</strong> SwitchBot API rate limit reached. Retry
          in {status.backoff_remaining} seconds.
        </div>
      )}
    </>
  );
}
