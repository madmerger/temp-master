import { useCallback, useEffect, useMemo, useState } from 'react';
import { Controls } from './components/Controls';
import { MeterCard } from './components/MeterCard';
import { Navbar } from './components/Navbar';
import { StatusBar } from './components/StatusBar';
import { fetchHistory, fetchMeters, fetchStatus, triggerRefresh } from './lib/api';
import { API_BASE, REFRESH_INTERVAL, isStaleMeter } from './lib/constants';
import type { HistoryReading, Meter, StatusResponse, TimeScale } from './types';

export default function App() {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [history, setHistory] = useState<Record<string, HistoryReading[]>>({});
  const [timeScale, setTimeScale] = useState<TimeScale>('day');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadData = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }
    try {
      const [metersResponse, statusResponse] = await Promise.all([fetchMeters(), fetchStatus()]);
      setMeters(metersResponse.meters ?? []);
      setStatus(statusResponse);
      setLastRefresh(new Date());
      setConnected(true);
      setError(null);
    } catch (loadError) {
      setConnected(false);
      setError(`Failed to fetch data: ${loadError instanceof Error ? loadError.message : String(loadError)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData(true);
    const intervalId = window.setInterval(() => void loadData(), REFRESH_INTERVAL);
    return () => window.clearInterval(intervalId);
  }, [loadData]);

  useEffect(() => {
    let cancelled = false;
    const activeMeters = meters.filter((meter) => !isStaleMeter(meter));
    void Promise.all(activeMeters.map(async (meter) => {
      try {
        const response = await fetchHistory(meter.device_id, timeScale);
        return [meter.device_id, response.history ?? []] as const;
      } catch {
        return [meter.device_id, []] as const;
      }
    })).then((entries) => {
      if (!cancelled) {
        setHistory(Object.fromEntries(entries));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [meters, timeScale]);

  const [activeMeters, staleMeters] = useMemo(() => {
    const active: Meter[] = [];
    const stale: Meter[] = [];
    meters.forEach((meter) => (isStaleMeter(meter) ? stale : active).push(meter));
    return [active, stale];
  }, [meters]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await triggerRefresh();
      await loadData();
    } catch (refreshError) {
      setError(`Failed to refresh: ${refreshError instanceof Error ? refreshError.message : String(refreshError)}`);
      setConnected(false);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <Navbar connected={connected} />
      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <Controls
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          onRefresh={() => void handleRefresh()}
          onBackup={() => window.open(`${API_BASE}/api/backup`, '_blank')}
          refreshing={refreshing}
        />
        <StatusBar status={status} lastRefresh={lastRefresh} />
        {error && <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"><strong>Error.</strong> {error}</div>}
        {loading && <p className="py-10 text-center text-slate-500 dark:text-slate-400">Loading temperature data...</p>}
        {!loading && (
          <>
            {activeMeters.length > 0 && <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{activeMeters.map((meter) => <MeterCard key={meter.device_id} meter={meter} history={history[meter.device_id]} timeScale={timeScale} />)}</div>}
            {staleMeters.length > 0 && (
              <section className="space-y-3">
                <header>
                  <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-300">⚠ 未更新のメーター</h2>
                  <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">1週間以上更新されていないデバイス</p>
                </header>
                <div className="rounded-lg border border-amber-300 bg-amber-100/50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{staleMeters.map((meter) => <MeterCard key={meter.device_id} meter={meter} timeScale={timeScale} isStale />)}</div>
                </div>
              </section>
            )}
          </>
        )}
        <footer className="py-2 text-center text-xs text-slate-500 dark:text-slate-400">Temp Master Dashboard v2.0 - Built with React + Vite</footer>
      </main>
    </div>
  );
}
