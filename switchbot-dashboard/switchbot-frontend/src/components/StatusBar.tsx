import Alert from "react-bootstrap/Alert";
import type { StatusResponse } from "../types";

interface StatusBarProps {
  status: StatusResponse | null;
  connected: boolean;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export default function StatusBar({ status, connected }: StatusBarProps) {
  if (!status || !connected) return null;

  const now = new Date();
  const refreshText = `Last refresh: ${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}`;
  const noun = status.meters_count === 1 ? "meter" : "meters";

  return (
    <>
      <Alert variant="info" className="d-flex justify-content-between">
        <span>
          Monitoring {status.meters_count} {noun}
        </span>
        <span>{refreshText}</span>
      </Alert>

      {status.is_rate_limited && (
        <Alert variant="warning">
          <strong>Rate Limited.</strong> SwitchBot API rate limit reached. Retry
          in {status.backoff_remaining} seconds.
        </Alert>
      )}
    </>
  );
}
