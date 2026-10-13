import { useEffect, useState } from 'react';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchHistory,
  fetchLatencyStats,
  fetchMeters,
  fetchStatus,
  triggerRefresh,
} from './api/client';
import type { TimeScale } from './api/types';
import { ApiHealthPanel } from './components/ApiHealthPanel';
import { MeterCard } from './components/MeterCard';
import { ThemeSelector } from './components/ThemeSelector';
import { isStaleMeter, pad2 } from './lib/format';
import { useTheme } from './theme/ThemeProvider';

const REFRESH_INTERVAL = 30_000;

const timeRanges: { value: TimeScale; label: string }[] = [
  { value: 'hour', label: 'Last Hour' },
  { value: 'day', label: 'Last 24 Hours' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'year', label: 'Last Year' },
];

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default function App() {
  const queryClient = useQueryClient();
  const { resolvedTheme } = useTheme();
  const [timeScale, setTimeScale] = useState<TimeScale>('day');
  const [refreshError, setRefreshError] = useState<string>();
  const [backupError, setBackupError] = useState<string>();
  const [downloading, setDownloading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const metersQuery = useQuery({
    queryKey: ['meters'],
    queryFn: fetchMeters,
    refetchInterval: REFRESH_INTERVAL,
  });
  const statusQuery = useQuery({
    queryKey: ['status'],
    queryFn: fetchStatus,
    refetchInterval: REFRESH_INTERVAL,
  });
  const latencyQuery = useQuery({
    queryKey: ['latency-stats'],
    queryFn: () =>
      fetchLatencyStats(
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      ),
    refetchInterval: REFRESH_INTERVAL,
  });

  const meters = metersQuery.data?.meters ?? [];
  const activeMeters = meters.filter((meter) => !isStaleMeter(meter));
  const staleMeters = meters.filter((meter) => isStaleMeter(meter));
  const historyQueries = useQueries({
    queries: activeMeters.map((meter) => ({
      queryKey: ['history', meter.device_id, timeScale],
      queryFn: () => fetchHistory(meter.device_id, timeScale),
      refetchInterval: REFRESH_INTERVAL,
      enabled: !isStaleMeter(meter),
    })),
  });

  const [lastRefresh, setLastRefresh] = useState<Date>();
  useEffect(() => {
    if (
      metersQuery.isSuccess &&
      statusQuery.isSuccess &&
      !metersQuery.isError &&
      !statusQuery.isError
    ) {
      setLastRefresh(
        new Date(Math.max(metersQuery.dataUpdatedAt, statusQuery.dataUpdatedAt)),
      );
      setRefreshError(undefined);
      setBackupError(undefined);
    }
  }, [
    metersQuery.dataUpdatedAt,
    metersQuery.isError,
    metersQuery.isSuccess,
    statusQuery.dataUpdatedAt,
    statusQuery.isError,
    statusQuery.isSuccess,
  ]);

  const disconnected = metersQuery.isError || statusQuery.isError;
  const isLoading =
    !metersQuery.data &&
    !statusQuery.data &&
    (metersQuery.isLoading || statusQuery.isLoading);
  const mainError = metersQuery.isError
    ? `Failed to fetch meters: ${getErrorMessage(metersQuery.error)}`
    : statusQuery.isError
      ? `Failed to fetch status: ${getErrorMessage(statusQuery.error)}`
      : refreshError ?? backupError;

  async function handleRefresh() {
    setRefreshing(true);
    setRefreshError(undefined);
    try {
      await triggerRefresh();
    } catch (error) {
      setRefreshError(`Failed to refresh: ${getErrorMessage(error)}`);
    } finally {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['meters'] }),
        queryClient.invalidateQueries({ queryKey: ['status'] }),
        queryClient.invalidateQueries({ queryKey: ['latency-stats'] }),
        queryClient.invalidateQueries({ queryKey: ['history'] }),
      ]);
      setRefreshing(false);
    }
  }

  async function handleBackup() {
    setDownloading(true);
    setBackupError(undefined);
    try {
      const response = await fetch('/api/backup');
      if (!response.ok) {
        let requestId: string | undefined;
        try {
          const body: unknown = await response.json();
          if (
            body &&
            typeof body === 'object' &&
            'request_id' in body &&
            typeof body.request_id === 'string'
          ) {
            requestId = body.request_id;
          }
        } catch {
          requestId = undefined;
        }
        setBackupError(
          `Failed to download backup (HTTP ${response.status}).${
            requestId ? ` Request ID: ${requestId}` : ''
          }`,
        );
        return;
      }

      const disposition = response.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="?([^";]+)"?/);
      const filename = match ? match[1] : 'switchbot_backup.db';
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (error) {
      setBackupError(`Failed to download backup: ${getErrorMessage(error)}`);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 transition-colors dark:bg-gray-900 dark:text-gray-100">
      <header className="fixed inset-x-0 top-0 z-20 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-900/95">
        <nav className="mx-auto flex min-h-16 max-w-screen-2xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-5">
            <a
              href="/"
              className="truncate text-base font-bold text-gray-900 dark:text-white sm:text-lg"
            >
              Temp Master Dashboard
            </a>
            <a
              href="/"
              className="hidden border-b-2 border-blue-600 py-5 text-sm font-medium text-blue-700 dark:text-blue-300 sm:block"
            >
              Dashboard
            </a>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                disconnected
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200'
                  : 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-200'
              }`}
            >
              {disconnected ? 'Disconnected' : 'Connected'}
            </span>
            <ThemeSelector />
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-screen-2xl px-4 pb-4 pt-24 sm:px-6">
        <section className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <label
            htmlFor="time-scale-select"
            className="text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            Time Range:
          </label>
          <select
            id="time-scale-select"
            value={timeScale}
            onChange={(event) => setTimeScale(event.target.value as TimeScale)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          >
            {timeRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-700 dark:hover:bg-blue-600"
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
          <button
            type="button"
            onClick={handleBackup}
            disabled={downloading}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
          >
            {downloading ? 'Downloading...' : 'Download Backup'}
          </button>
        </section>

        {statusQuery.data && (
          <section className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-100">
            <span>
              Monitoring {statusQuery.data.meters_count}{' '}
              {statusQuery.data.meters_count === 1 ? 'meter' : 'meters'}
            </span>
            {lastRefresh && (
              <span>
                Last refresh: {pad2(lastRefresh.getHours())}:
                {pad2(lastRefresh.getMinutes())}:{pad2(lastRefresh.getSeconds())}
              </span>
            )}
          </section>
        )}

        {statusQuery.data?.is_rate_limited && (
          <section
            role="status"
            className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100"
          >
            <strong>Rate Limited.</strong>{' '}
            <span>
              SwitchBot API rate limit reached. Retry in{' '}
              {statusQuery.data.backoff_remaining || 0} seconds.
            </span>
          </section>
        )}

        {isLoading && (
          <p className="py-10 text-center text-gray-500 dark:text-gray-400">
            Loading temperature data...
          </p>
        )}

        {mainError && (
          <div
            role="alert"
            className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/50 dark:text-red-100"
          >
            <strong>Error.</strong> {mainError}
          </div>
        )}

        <ApiHealthPanel
          latency={latencyQuery.data}
          status={statusQuery.data}
        />

        {metersQuery.data && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
            {activeMeters.map((meter, index) => (
              <MeterCard
                key={meter.device_id}
                meter={meter}
                history={historyQueries[index]?.data?.history}
                timeScale={timeScale}
              />
            ))}
          </div>
        )}

        {staleMeters.length > 0 && (
          <section className="mt-8">
            <div className="mb-3">
              <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-200">
                <span aria-hidden="true">⚠ </span>未更新のメーター
              </h2>
              <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
                1週間以上更新されていないデバイス
              </p>
            </div>
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
                {staleMeters.map((meter) => (
                  <MeterCard
                    key={meter.device_id}
                    meter={meter}
                    timeScale={timeScale}
                    stale
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="px-4 pb-6 pt-2 text-center text-xs text-gray-500 dark:text-gray-400">
        Temp Master Dashboard v2.0 - Built with React + Tailwind CSS
      </footer>
      <span className="sr-only" aria-live="polite">
        Theme: {resolvedTheme}
      </span>
    </div>
  );
}
