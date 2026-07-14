import { formatRefreshTime } from "../utils";

interface StatusBarProps {
  metersCount: number;
  lastRefresh: Date;
}

export function StatusBar({ metersCount, lastRefresh }: StatusBarProps) {
  const noun = metersCount === 1 ? "meter" : "meters";

  return (
    <section className="status-bar" aria-label="Dashboard status">
      <span>
        <span className="pulse" aria-hidden="true" />
        Monitoring <strong>{metersCount}</strong> {noun}
      </span>
      <span>Last refresh: {formatRefreshTime(lastRefresh)}</span>
    </section>
  );
}
