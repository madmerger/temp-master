import { useState, useCallback } from 'react';
import type { TimeScale } from './constants';
import { useMeters } from './hooks/useMeters';
import { useStatus } from './hooks/useStatus';
import { Navbar } from './components/Navbar';
import { ControlPanel } from './components/ControlPanel';
import { StatusBar } from './components/StatusBar';
import { MeterPanel } from './components/MeterPanel';
import styles from './App.module.css';

export function App() {
  const [timeScale, setTimeScale] = useState<TimeScale>('day');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const { meters, loading, error, connected, reload: reloadMeters } = useMeters();
  const { status, reload: reloadStatus } = useStatus();

  const handleRefreshComplete = useCallback(() => {
    void reloadMeters();
    void reloadStatus();
    setLastRefresh(new Date());
  }, [reloadMeters, reloadStatus]);

  return (
    <>
      <Navbar connected={connected} />
      <main className={styles.main}>
        <ControlPanel
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          onRefreshComplete={handleRefreshComplete}
        />
        <StatusBar status={status} lastRefresh={lastRefresh} />

        {loading && (
          <p className={styles.loading}>Loading temperature data...</p>
        )}

        {error && (
          <div className={styles.error}>
            <strong>Error.</strong> {error}
          </div>
        )}

        <div className={styles.grid}>
          {meters.map((meter) => (
            <div key={meter.device_id} className={styles.col}>
              <MeterPanel meter={meter} timeScale={timeScale} />
            </div>
          ))}
        </div>

        <footer className={styles.footer}>
          Temp Master Dashboard v2.0 &mdash; Built with React + Vite
        </footer>
      </main>
    </>
  );
}
