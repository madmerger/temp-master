import type { StatusResponse } from "../api/meters";

interface StatusBarProps {
  status: StatusResponse | null;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function StatusBar({ status }: StatusBarProps) {
  if (!status) return null;

  const now = new Date();
  const refreshText = `Last refresh: ${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
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
