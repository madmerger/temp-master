import type { StatusResponse } from "../api";

function pad2(n: number): string {
  return n < 10 ? "0" + n : "" + n;
}

interface Props {
  status: StatusResponse | null;
  lastRefresh: Date | null;
}

export function StatusBar({ status, lastRefresh }: Props) {
  if (!status) {
    return null;
  }
  const count = status.meters_count || 0;
  const noun = count === 1 ? "meter" : "meters";
  const refreshText = lastRefresh
    ? `Last refresh: ${pad2(lastRefresh.getHours())}:${pad2(
        lastRefresh.getMinutes(),
      )}:${pad2(lastRefresh.getSeconds())}`
    : "";

  return (
    <div className="alert alert-info">
      <span>{`Monitoring ${count} ${noun}`}</span>
      <span>{refreshText}</span>
    </div>
  );
}
