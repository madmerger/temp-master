import { useState, useEffect, useCallback, useRef } from "react";
import type { MeterDevice, StatusResponse, TimeScale } from "./types";
import { fetchMeters, fetchStatus } from "./api";
import { REFRESH_INTERVAL } from "./constants/displayNames";
import { useTheme } from "./hooks/useTheme";
import { Navbar } from "./components/Navbar";
import { Controls } from "./components/Controls";
import { StatusBar } from "./components/StatusBar";
import { RateLimitWarning } from "./components/RateLimitWarning";
import { MeterCard } from "./components/MeterCard";

export function App() {
  const { theme, setTheme } = useTheme();
  const [meters, setMeters] = useState<MeterDevice[]>([]);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [timeScale, setTimeScale] = useState<TimeScale>("day");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [metersResp, statusResp] = await Promise.all([
        fetchMeters(),
        fetchStatus(),
      ]);
      setMeters(metersResp.meters);
      setStatus(statusResp);
      setLoading(false);
      setError(null);
      setConnected(true);
      setLastRefreshTime(new Date());
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setLoading(false);
      setError(
        `Failed to fetch data: ${err instanceof Error ? err.message : String(err)}`,
      );
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    intervalRef.current = setInterval(loadData, REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadData]);

  const handleRefreshComplete = useCallback(() => {
    loadData();
  }, [loadData]);

  const handleError = useCallback((message: string) => {
    setError(message);
    setConnected(false);
  }, []);

  return (
    <>
      <Navbar connected={connected} theme={theme} onThemeChange={setTheme} />
      <div className="container">
        <Controls
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          onRefreshComplete={handleRefreshComplete}
          onError={handleError}
        />

        <StatusBar status={status} lastRefreshTime={lastRefreshTime} />
        <RateLimitWarning status={status} />

        {loading && (
          <div className="loading">
            <p>Loading temperature data...</p>
          </div>
        )}

        {error && !loading && (
          <div className="alert alert-danger">
            <strong>Error.</strong> {error}
          </div>
        )}

        {!loading && meters.length > 0 && (
          <div className="meters-grid">
            {meters.map((meter) => (
              <MeterCard
                key={meter.device_id}
                meter={meter}
                timeScale={timeScale}
                theme={theme}
                refreshKey={refreshKey}
              />
            ))}
          </div>
        )}

        <footer className="footer">
          Temp Master Dashboard v2.0 — React + TypeScript + Vite
        </footer>
      </div>
    </>
  );
}
