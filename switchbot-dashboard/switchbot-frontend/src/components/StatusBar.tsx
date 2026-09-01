import type { StatusResponse } from '../api/types';
import { formatClockTime } from '../utils/format';

interface Props {
  status: StatusResponse | null;
  lastRefresh: Date | null;
}

export function StatusBar({ status, lastRefresh }: Props) {
  if (!status) {
    return null;
  }

  const count = status.meters_count ?? 0;
  const noun = count === 1 ? 'meter' : 'meters';

  return (
    <>
      <div className="alert mb-4 flex flex-wrap justify-between gap-2 border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-100">
        <span>{`Monitoring ${count} ${noun}`}</span>
        {lastRefresh && <span>{`Last refresh: ${formatClockTime(lastRefresh)}`}</span>}
      </div>
      {status.is_rate_limited && (
        <div className="alert mb-4 border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
          <strong>Rate Limited.</strong>{' '}
          {`SwitchBot API rate limit reached. Retry in ${status.backoff_remaining ?? 0} seconds.`}
        </div>
      )}
    </>
  );
}
