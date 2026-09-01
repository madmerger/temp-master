import { useMemo, useState } from 'react';
import type { TimeScale } from './api/types';
import { Controls } from './components/Controls';
import { Header } from './components/Header';
import { MeterCard } from './components/MeterCard';
import { StaleMetersSection } from './components/StaleMetersSection';
import { StatusBar } from './components/StatusBar';
import { useDashboardData } from './hooks/useDashboardData';
import { useTheme } from './hooks/useTheme';
import { isStaleMeter } from './utils/format';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [timeScale, setTimeScale] = useState<TimeScale>('day');
  const {
    meters,
    status,
    dataVersion,
    loading,
    error,
    connected,
    lastRefresh,
    refreshing,
    manualRefresh,
  } = useDashboardData();

  const { activeMeters, staleMeters } = useMemo(() => {
    const active = meters.filter((meter) => !isStaleMeter(meter));
    const stale = meters.filter((meter) => isStaleMeter(meter));
    return { activeMeters: active, staleMeters: stale };
  }, [meters]);

  return (
    <div className="min-h-screen">
      <Header connected={connected} theme={theme} onToggleTheme={toggleTheme} />

      <main className="mx-auto max-w-screen-2xl px-4 pb-8 pt-20">
        <Controls
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          onRefresh={() => void manualRefresh()}
          refreshing={refreshing}
        />

        <StatusBar status={status} lastRefresh={lastRefresh} />

        {error && (
          <div className="alert mb-4 border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100">
            <strong>Error.</strong> {error}
          </div>
        )}

        {loading ? (
          <p className="py-10 text-center text-slate-500 dark:text-slate-400">
            Loading temperature data...
          </p>
        ) : (
          <>
            {activeMeters.length > 0 && (
              <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {activeMeters.map((meter) => (
                  <MeterCard
                    key={meter.device_id}
                    meter={meter}
                    timeScale={timeScale}
                    dataVersion={dataVersion}
                    theme={theme}
                  />
                ))}
              </div>
            )}

            <StaleMetersSection
              meters={staleMeters}
              timeScale={timeScale}
              dataVersion={dataVersion}
              theme={theme}
            />
          </>
        )}

        <footer className="my-8 text-center text-xs text-slate-500 dark:text-slate-400">
          Temp Master Dashboard v2.0 - Built with React + TypeScript + Vite + Tailwind CSS
        </footer>
      </main>
    </div>
  );
}
