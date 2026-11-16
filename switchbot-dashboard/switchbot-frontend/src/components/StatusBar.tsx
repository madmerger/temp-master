import type { Status } from '../types';
export function StatusBar({ status, updatedAt }: { status?: Status; updatedAt: number }) {
  if (!status) return null;
  return (
    <>
      <div className="mb-5 flex flex-wrap justify-between gap-2 rounded-lg bg-sky-50 px-4 py-3 text-sm text-sky-900">
        <span>
          Monitoring {status.meters_count || 0} {status.meters_count === 1 ? 'meter' : 'meters'}
        </span>
        <span>Last refresh: {new Date(updatedAt).toLocaleTimeString()}</span>
      </div>
      {status.is_rate_limited && (
        <div role="alert" className="mb-5 rounded-lg bg-amber-50 p-4 text-amber-900">
          <strong>Rate Limited.</strong> SwitchBot API rate limit reached. Retry in{' '}
          {status.backoff_remaining || 0} seconds.
        </div>
      )}
    </>
  );
}
