import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchMeters, fetchStatus, triggerRefresh, getBackupUrl } from './api';
import { DEFAULT_TIME_SCALE, REFRESH_INTERVAL } from './constants';
import { formatLastRefresh } from './utils';
import { Navbar } from './components/Navbar';
import { Controls } from './components/Controls';
import { StatusBar } from './components/StatusBar';
import { MeterCard } from './components/MeterCard';
import { Footer } from './components/Footer';
import type { MeterDevice, StatusResponse, TimeScale } from './types';
import './App.css';

export default function App() {
  const [meters, setMeters] = useState<MeterDevice[]>([]);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [timeScale, setTimeScale] = useState<TimeScale>(DEFAULT_TIME_SCALE);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState('');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [metersRes, statusRes] = await Promise.all([fetchMeters(), fetchStatus()]);
      setMeters(metersRes.meters);
      setStatus(statusRes);
      setConnected(true);
      setError(null);
      setLastRefresh(formatLastRefresh());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(msg);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
    intervalRef.current = setInterval(() => void loadData(), REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await triggerRefresh();
      await loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to refresh';
      setError(msg);
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  const handleBackup = useCallback(() => {
    window.open(getBackupUrl(), '_blank');
  }, []);

  return (
    <div className="app">
      <Navbar connected={connected} />

      <main className="main-content">
        <Controls
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          onRefresh={() => void handleRefresh()}
          onBackup={handleBackup}
          refreshing={refreshing}
        />

        <StatusBar status={status} lastRefresh={lastRefresh} />

        {loading && <div className="loading-message">Loading temperature data...</div>}

        {error && (
          <div className="alert alert-error">
            <strong>Error.</strong> {error}
          </div>
        )}

        <div className="meters-grid">
          {meters.map((meter) => (
            <MeterCard key={meter.device_id} meter={meter} timeScale={timeScale} />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
