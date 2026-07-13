import { useMemo, useState } from "react";
import type { TimeScale } from "./api";
import { Controls } from "./components/Controls";
import { MeterCard } from "./components/MeterCard";
import { Navbar } from "./components/Navbar";
import { RateLimitWarning } from "./components/RateLimitWarning";
import { StaleMetersSection } from "./components/StaleMetersSection";
import { StatusBar } from "./components/StatusBar";
import { isStaleMeter } from "./constants";
import { useDashboardData } from "./hooks";
import { useTheme } from "./theme";

export function App() {
  const { theme, toggleTheme } = useTheme();
  const [timeScale, setTimeScale] = useState<TimeScale>("day");
  const {
    meters,
    status,
    connected,
    loading,
    error,
    lastRefresh,
    refreshing,
    triggerAndReload,
  } = useDashboardData();

  const { activeMeters, staleMeters } = useMemo(() => {
    const active = [];
    const stale = [];
    for (const meter of meters) {
      if (isStaleMeter(meter)) {
        stale.push(meter);
      } else {
        active.push(meter);
      }
    }
    return { activeMeters: active, staleMeters: stale };
  }, [meters]);

  const refreshKey = lastRefresh ? lastRefresh.getTime() : 0;

  return (
    <>
      <Navbar connected={connected} theme={theme} onToggleTheme={toggleTheme} />
      <div className="container">
        <Controls
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          onRefresh={() => void triggerAndReload()}
          refreshing={refreshing}
        />

        <StatusBar status={status} lastRefresh={lastRefresh} />
        <RateLimitWarning status={status} />

        {loading && (
          <div className="loading">
            <p>Loading temperature data...</p>
          </div>
        )}

        {!loading && error && (
          <div className="alert alert-danger">
            <strong>Error.</strong> {error}
          </div>
        )}

        {!loading && (
          <>
            {activeMeters.length > 0 && (
              <div className="meter-grid">
                {activeMeters.map((meter) => (
                  <MeterCard
                    key={meter.device_id}
                    meter={meter}
                    isStale={false}
                    timeScale={timeScale}
                    theme={theme}
                    refreshKey={refreshKey}
                  />
                ))}
              </div>
            )}
            <StaleMetersSection
              meters={staleMeters}
              timeScale={timeScale}
              theme={theme}
              refreshKey={refreshKey}
            />
          </>
        )}

        <footer>Temp Master Dashboard v2.0 - Built with React + Vite + Recharts</footer>
      </div>
    </>
  );
}
