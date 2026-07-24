import { useMemo, useState } from 'react';
import Controls from './components/Controls';
import MeterGrid from './components/MeterGrid';
import Navbar from './components/Navbar';
import StaleMetersSection from './components/StaleMetersSection';
import { useMeters } from './hooks/useMeters';
import type { TimeScale } from './types';
import { isStaleMeter } from './utils/format';

function pad2(n: number): string {
  return n < 10 ? '0' + n : String(n);
}

export default function App() {
  const [timeScale, setTimeScale] = useState<TimeScale>('day');
  const {
    meters,
    status,
    connected,
    loading,
    error,
    lastRefresh,
    refreshing,
    triggerServerRefresh,
  } = useMeters();

  const { activeMeters, staleMeters } = useMemo(() => {
    const active = [];
    const stale = [];
    for (const meter of meters) {
      if (isStaleMeter(meter.last_updated)) stale.push(meter);
      else active.push(meter);
    }
    return { activeMeters: active, staleMeters: stale };
  }, [meters]);

  // Bump on each server refresh so child charts refetch their history.
  const refreshKey = lastRefresh ? lastRefresh.getTime() : 0;

  const metersCount = status?.meters_count ?? 0;
  const meterNoun = metersCount === 1 ? 'meter' : 'meters';
  const lastRefreshText = lastRefresh
    ? `Last refresh: ${pad2(lastRefresh.getHours())}:${pad2(lastRefresh.getMinutes())}:${pad2(lastRefresh.getSeconds())}`
    : '';

  return (
    <div className="min-h-full bg-gray-100 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <Navbar connected={connected} />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-20">
        <div className="mb-4">
          <Controls
            timeScale={timeScale}
            onTimeScaleChange={setTimeScale}
            onRefresh={() => void triggerServerRefresh()}
            refreshing={refreshing}
          />
        </div>

        {status && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-200">
            <span>
              Monitoring {metersCount} {meterNoun}
            </span>
            <span className="text-blue-600 dark:text-blue-300">{lastRefreshText}</span>
          </div>
        )}

        {status?.is_rate_limited && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-700/60 dark:bg-amber-900/20 dark:text-amber-200">
            <strong>Rate Limited.</strong>{' '}
            SwitchBot API rate limit reached.
            {status.backoff_remaining
              ? ` Retry in ${status.backoff_remaining} seconds.`
              : ''}
          </div>
        )}

        {loading && (
          <div className="py-16 text-center text-gray-500 dark:text-gray-400">
            Loading temperature data...
          </div>
        )}

        {!loading && error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200">
            <strong>Error.</strong> {error}
          </div>
        )}

        {!loading && (
          <>
            <MeterGrid
              meters={activeMeters}
              timeScale={timeScale}
              refreshKey={refreshKey}
            />
            <StaleMetersSection
              meters={staleMeters}
              timeScale={timeScale}
              refreshKey={refreshKey}
            />
          </>
        )}

        <footer className="mt-10 text-center text-xs text-gray-500 dark:text-gray-500">
          Temp Master Dashboard v1.0 - Built with React + TypeScript + Vite
        </footer>
      </main>
    </div>
  );
}
