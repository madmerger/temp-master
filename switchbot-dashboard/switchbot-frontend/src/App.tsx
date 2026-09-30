import { useCallback, useEffect, useMemo, useState } from 'react';
import { BACKUP_URL, fetchMeters, fetchStatus, triggerRefresh } from './api';
import Controls from './components/Controls';
import MeterCard from './components/MeterCard';
import MeterGrid from './components/MeterGrid';
import Navbar from './components/Navbar';
import RateLimitWarning from './components/RateLimitWarning';
import StaleMetersSection from './components/StaleMetersSection';
import StatusBar from './components/StatusBar';
import { useDarkMode } from './hooks/useDarkMode';
import { isStaleMeter, REFRESH_INTERVAL_MS } from './meters';
import type { Meter, Status, TimeScale } from './types';

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export default function App() {
  const [isDark, toggleDark] = useDarkMode();
  const [timeScale, setTimeScale] = useState<TimeScale>('day');
  const [meters, setMeters] = useState<Meter[]>([]);
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [metersResp, statusResp] = await Promise.all([fetchMeters(), fetchStatus()]);
      setMeters(metersResp.meters ?? []);
      setStatus(statusResp);
      setError(null);
      setConnected(true);
      setLastRefresh(new Date());
    } catch (err) {
      setError(`Failed to fetch data: ${errorMessage(err)}`);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
    const id = setInterval(() => void fetchData(), REFRESH_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await triggerRefresh();
    } catch (err) {
      setError(`Failed to refresh: ${errorMessage(err)}`);
      setConnected(false);
    }
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleBackup = useCallback(() => {
    window.open(BACKUP_URL, '_blank');
  }, []);

  const { activeMeters, staleMeters } = useMemo(() => {
    const now = lastRefresh?.getTime() ?? Date.now();
    const active: Meter[] = [];
    const stale: Meter[] = [];
    for (const meter of meters) {
      (isStaleMeter(meter, now) ? stale : active).push(meter);
    }
    return { activeMeters: active, staleMeters: stale };
  }, [meters, lastRefresh]);

  const refreshKey = lastRefresh?.getTime() ?? 0;

  return (
    <div className="min-h-screen bg-gray-100 pt-[70px] text-gray-900 transition-colors dark:bg-gray-950 dark:text-gray-100">
      <Navbar connected={connected} isDark={isDark} onToggleDark={toggleDark} />

      <main className="px-4">
        <Controls
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          refreshing={refreshing}
          onRefresh={() => void handleRefresh()}
          onBackup={handleBackup}
        />

        {status && <StatusBar status={status} lastRefresh={lastRefresh} />}
        {status?.is_rate_limited && <RateLimitWarning backoffRemaining={status.backoff_remaining} />}

        {loading && (
          <p className="py-10 text-center text-gray-500 dark:text-gray-400">Loading temperature data...</p>
        )}

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/60 dark:text-red-200"
          >
            <strong>Error.</strong> {error}
          </div>
        )}

        {activeMeters.length > 0 && (
          <MeterGrid>
            {activeMeters.map((meter) => (
              <MeterCard
                key={meter.device_id}
                meter={meter}
                isStale={false}
                timeScale={timeScale}
                refreshKey={refreshKey}
                isDark={isDark}
              />
            ))}
          </MeterGrid>
        )}

        {staleMeters.length > 0 && (
          <StaleMetersSection meters={staleMeters} timeScale={timeScale} refreshKey={refreshKey} isDark={isDark} />
        )}

        <footer className="mb-5 mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
          Temp Master Dashboard v2.0 - Built with React + Tailwind CSS
        </footer>
      </main>
    </div>
  );
}
