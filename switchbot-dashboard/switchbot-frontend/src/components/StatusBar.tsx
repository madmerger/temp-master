import type { StatusResponse } from "../types";

interface StatusBarProps {
  status: StatusResponse | null;
  lastRefreshTime: Date | null;
}

function pad2(n: number): string {
  return n < 10 ? "0" + String(n) : String(n);
}

export function StatusBar({ status, lastRefreshTime }: StatusBarProps) {
  if (!status) return null;

  const count = status.meters_count;
  const noun = count === 1 ? "meter" : "meters";
  const refreshText = lastRefreshTime
    ? `Last refresh: ${pad2(lastRefreshTime.getHours())}:${pad2(lastRefreshTime.getMinutes())}:${pad2(lastRefreshTime.getSeconds())}`
    : "";

  return (
    <div className="alert alert-info">
      <span>Monitoring {count} {noun}</span>
      <span className="pull-right">{refreshText}</span>
    </div>
  );
}
