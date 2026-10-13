import type { LatencyStats, StatusResponse } from '../api/types';

interface ApiHealthPanelProps {
  latency?: LatencyStats;
  status?: StatusResponse;
}

function formatNumber(value: number | null | undefined, decimals = 0): string {
  return value === null || value === undefined
    ? '—'
    : value.toFixed(decimals);
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-24">
      <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className="mt-1 font-semibold text-gray-900 dark:text-gray-100">
        {value}
      </dd>
    </div>
  );
}

export function ApiHealthPanel({ latency, status }: ApiHealthPanelProps) {
  const successRate =
    latency?.total_calls && latency.success_rate !== null
      ? `${formatNumber(latency.success_rate, 1)}%`
      : '—';

  return (
    <section
      className="mb-5 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-800"
      aria-label="API Health (24h)"
    >
      <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
        API Health (24h)
      </h2>
      <dl className="flex flex-wrap gap-x-8 gap-y-3">
        <Stat
          label="Avg latency"
          value={
            latency?.avg_latency_ms === null ||
            latency?.avg_latency_ms === undefined
              ? '—'
              : `${formatNumber(latency.avg_latency_ms)} ms`
          }
        />
        <Stat
          label="Min / max latency"
          value={`${formatNumber(latency?.min_latency_ms)} / ${formatNumber(latency?.max_latency_ms)} ms`}
        />
        <Stat label="Success rate" value={successRate} />
        <Stat
          label="Total / failed calls"
          value={`${latency?.total_calls ?? '—'} / ${latency?.failed_calls ?? '—'}`}
        />
        <Stat
          label="Configured"
          value={status ? (status.configured ? 'Yes' : 'No') : '—'}
        />
        <Stat
          label="Collection interval"
          value={
            status?.collection_interval !== undefined
              ? `${status.collection_interval} seconds`
              : '—'
          }
        />
      </dl>
    </section>
  );
}
