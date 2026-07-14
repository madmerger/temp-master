import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchMeters, fetchStatus, getBackupUrl, triggerRefresh } from "./api";
import { Controls } from "./components/Controls";
import { MeterGrid } from "./components/MeterGrid";
import { Navbar } from "./components/Navbar";
import { RateLimitWarning } from "./components/RateLimitWarning";
import { StaleMetersSection } from "./components/StaleMetersSection";
import { StatusBar } from "./components/StatusBar";
import { REFRESH_INTERVAL } from "./constants";
import type { Meter, StatusResponse, TimeScale } from "./types";
import { isStaleMeter } from "./utils";

export default function App() {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [timeScale, setTimeScale] = useState<TimeScale>("day");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);

  const loadDashboard = useCallback(async () => {
    try {
      const [metersResponse, statusResponse] = await Promise.all([fetchMeters(), fetchStatus()]);
      setMeters(metersResponse.meters);
      setStatus(statusResponse);
      setLastRefresh(new Date());
      setRefreshKey((value) => value + 1);
      setError(null);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Failed to fetch data.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
    const intervalId = window.setInterval(() => void loadDashboard(), REFRESH_INTERVAL);
    return () => window.clearInterval(intervalId);
  }, [loadDashboard]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await triggerRefresh();
      await loadDashboard();
    } catch (refreshError) {
      const message =
        refreshError instanceof Error ? refreshError.message : "Failed to refresh data.";
      setError(message);
    } finally {
      setRefreshing(false);
    }
  };

  const { activeMeters, staleMeters } = useMemo(() => {
    const active: Meter[] = [];
    const stale: Meter[] = [];
    meters.forEach((meter) => (isStaleMeter(meter) ? stale.push(meter) : active.push(meter)));
    return { activeMeters: active, staleMeters: stale };
  }, [meters]);

  return (
    <>
      <Navbar
        connectionState={loading ? "loading" : error || !status ? "disconnected" : "connected"}
      />
      <main className="page-shell">
        <Controls
          timeScale={timeScale}
          refreshing={refreshing}
          onTimeScaleChange={setTimeScale}
          onRefresh={() => void handleRefresh()}
          onBackup={() => window.open(getBackupUrl(), "_blank", "noopener,noreferrer")}
        />

        {status && <StatusBar metersCount={status.meters_count} lastRefresh={lastRefresh} />}
        {status?.is_rate_limited && (
          <RateLimitWarning backoffRemaining={status.backoff_remaining} />
        )}
        {error && (
          <aside className="alert error" role="alert">
            <span className="alert-icon" aria-hidden="true">
              !
            </span>
            <div>
              <strong>Unable to update the dashboard</strong>
              <p>{error}</p>
            </div>
          </aside>
        )}

        {loading ? (
          <div className="loading-state">
            <span className="spinner" aria-hidden="true" />
            <p>Loading temperature data...</p>
          </div>
        ) : (
          <>
            {meters.length === 0 && !error && (
              <div className="empty-state card">
                <h2>No meters found</h2>
                <p>Meter data will appear here after the backend collects its first reading.</p>
              </div>
            )}
            <MeterGrid
              meters={activeMeters}
              timeScale={timeScale}
              refreshKey={refreshKey}
            />
            <StaleMetersSection meters={staleMeters} />
          </>
        )}
      </main>
      <footer>Temp Master Dashboard v2.0 · Built with React + TypeScript + Vite</footer>
    </>
  );
}
