import { useState } from 'react';
import { ThemeProvider } from '../theme/ThemeProvider';
import { isStaleMeter } from '../utils/format';
import type { TimeScale } from '../types';
import { useDashboardData } from '../hooks/useDashboardData';
import { downloadBackup, triggerRefresh } from '../api';
import Controls from './Controls';
import MeterCard from './MeterCard';
import NavBar from './NavBar';
import RateLimitWarning from './RateLimitWarning';
import StaleMetersSection from './StaleMetersSection';
import StatusBar from './StatusBar';
import styles from './App.module.css';

function Dashboard() {
  const { meters, status, loading, error, connected, lastRefresh, refreshTick, reload } =
    useDashboardData();
  const [timeScale, setTimeScale] = useState<TimeScale>('day');
  const [actionError, setActionError] = useState<{ message: string; refreshTick: number } | null>(
    null,
  );
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const activeMeters = meters.filter((meter) => !isStaleMeter(meter));
  const staleMeters = meters.filter((meter) => isStaleMeter(meter));

  const visibleActionError =
    actionError?.refreshTick === refreshTick ? actionError.message : null;

  async function handleRefresh() {
    setRefreshing(true);
    setActionError(null);
    try {
      await triggerRefresh();
    } catch (refreshError) {
      const message =
        refreshError instanceof Error ? refreshError.message : String(refreshError);
      setActionError({ message: `Failed to refresh: ${message}`, refreshTick });
    } finally {
      await reload();
      setRefreshing(false);
    }
  }

  async function handleBackup() {
    setDownloading(true);
    setActionError(null);
    try {
      await downloadBackup();
    } catch (backupError) {
      const message = backupError instanceof Error ? backupError.message : String(backupError);
      setActionError({
        message: message.startsWith('Failed to download backup')
          ? message
          : `Failed to download backup: ${message}`,
        refreshTick,
      });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <NavBar connected={connected} />
      <main className={styles.container}>
        <Controls
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          onRefresh={handleRefresh}
          onBackup={handleBackup}
          refreshing={refreshing}
          downloading={downloading}
        />
        <StatusBar status={status} lastRefresh={lastRefresh} />
        <RateLimitWarning status={status} />
        {loading && <p className={styles.loading}>Loading temperature data...</p>}
        {(visibleActionError ?? error) && (
          <div className={styles.error} role="alert">
            <strong>Error.</strong> {visibleActionError ?? error}
          </div>
        )}
        <section className={styles.grid} aria-label="Active meters">
          {activeMeters.map((meter) => (
            <MeterCard
              key={meter.device_id}
              meter={meter}
              isStale={false}
              timeScale={timeScale}
              refreshTick={refreshTick}
            />
          ))}
        </section>
        <StaleMetersSection meters={staleMeters} timeScale={timeScale} refreshTick={refreshTick} />
        <footer className={styles.footer}>
          Temp Master Dashboard v2.0 - Built with React + TypeScript
        </footer>
      </main>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Dashboard />
    </ThemeProvider>
  );
}
