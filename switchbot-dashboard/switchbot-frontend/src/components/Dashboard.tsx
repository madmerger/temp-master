import { useCallback, useEffect, useRef, useState } from 'react';
import { REFRESH_INTERVAL } from '../config/constants';
import { fetchAllData, triggerRefresh } from '../api/meters';
import { Controls } from './Controls';
import { StatusBar } from './StatusBar';
import { MeterPanel } from './MeterPanel';
import type { MeterDevice, StatusResponse, ThemeId, TimeScale } from '../types';

interface DashboardProps {
  onConnectionChange: (connected: boolean) => void;
  themeId: ThemeId;
}

export function Dashboard({ onConnectionChange, themeId }: DashboardProps) {
  const [meters, setMeters] = useState<MeterDevice[]>([]);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [timeScale, setTimeScale] = useState<TimeScale>('day');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [metersRes, statusRes] = await fetchAllData();
      setMeters(metersRes.meters);
      setStatus(statusRes);
      setLastRefresh(new Date());
      setError(null);
      setLoading(false);
      onConnectionChange(true);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(msg);
      setLoading(false);
      onConnectionChange(false);
    }
  }, [onConnectionChange]);

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
    } catch {
      // refresh failure is non-fatal; loadData will update error state
    }
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  if (loading) {
    return (
      <div className="loading">
        <p>Loading temperature data...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <Controls
        timeScale={timeScale}
        onTimeScaleChange={setTimeScale}
        onRefresh={() => void handleRefresh()}
        refreshing={refreshing}
      />

      <StatusBar status={status} lastRefreshTime={lastRefresh} />

      {error && (
        <div className="alert alert-danger">
          <strong>Error.</strong> {error}
        </div>
      )}

      <div className="meter-grid">
        {meters.map((meter) => (
          <MeterPanel
            key={meter.device_id}
            meter={meter}
            timeScale={timeScale}
            refreshKey={refreshKey}
            themeId={themeId}
          />
        ))}
      </div>

      <footer className="footer">
        Temp Master Dashboard v2.0 &mdash; Built with React + TypeScript + Chart.js
      </footer>
    </div>
  );
}
