import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { triggerRefresh } from './api/client';
import type { TimeScale } from './api/types';
import Controls from './components/Controls';
import MeterGrid from './components/MeterGrid';
import Navbar from './components/Navbar';
import RateLimitWarning from './components/RateLimitWarning';
import StaleMetersSection from './components/StaleMetersSection';
import StatusBar from './components/StatusBar';
import { useMeters } from './hooks/useMeters';
import { useStatus } from './hooks/useStatus';
import { isStaleMeter } from './utils/stale';

export default function App() {
  const [timeScale, setTimeScale] = useState<TimeScale>('day');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const metersQuery = useMeters();
  const statusQuery = useStatus();
  const queryError = metersQuery.error || statusQuery.error;
  const error = refreshError || queryError?.message;
  const meters = metersQuery.data?.meters ?? [];
  const active = meters.filter((meter) => !isStaleMeter(meter));
  const stale = meters.filter(isStaleMeter);
  const connected = !error;

  useEffect(() => {
    if (metersQuery.dataUpdatedAt || statusQuery.dataUpdatedAt) {
      setRefreshError(null);
    }
  }, [metersQuery.dataUpdatedAt, statusQuery.dataUpdatedAt]);

  async function refresh() {
    setRefreshing(true);
    try {
      await triggerRefresh();
    } catch (refreshError) {
      setRefreshError(
        `Failed to refresh: ${
          refreshError instanceof Error ? refreshError.message : String(refreshError)
        }`,
      );
    } finally {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['meters'] }),
        queryClient.invalidateQueries({ queryKey: ['status'] }),
        queryClient.invalidateQueries({ queryKey: ['history'] }),
      ]);
      setRefreshing(false);
    }
  }

  return (
    <>
      <Navbar connected={connected} />
      <main className="mx-auto max-w-[1400px] px-4 pb-4 pt-20">
        <Controls
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          onRefresh={refresh}
          refreshing={refreshing}
        />
        {statusQuery.data && (
          <StatusBar
            count={statusQuery.data.meters_count}
            refreshedAt={new Date(
              Math.max(metersQuery.dataUpdatedAt, statusQuery.dataUpdatedAt),
            )}
          />
        )}
        {statusQuery.data?.is_rate_limited && (
          <RateLimitWarning remaining={statusQuery.data.backoff_remaining} />
        )}
        {metersQuery.isPending || statusQuery.isPending ? (
          <div className="py-10 text-center text-gray-500">
            Loading temperature data...
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-5 rounded border border-red-300 bg-red-50 px-4 py-3 text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200">
                <strong>Error.</strong>{' '}
                {refreshError
                  ? error
                  : `Failed to fetch ${metersQuery.error ? 'meters' : 'status'}: ${error}`}
              </div>
            )}
            {meters.length > 0 && (
              <>
                <MeterGrid meters={active} timeScale={timeScale} />
                <StaleMetersSection meters={stale} timeScale={timeScale} />
              </>
            )}
          </>
        )}
        <footer className="my-8 text-center text-xs text-gray-500">
          Temp Master Dashboard v1.0 - Built with React, Tailwind CSS, Recharts, and TanStack Query
        </footer>
      </main>
    </>
  );
}
