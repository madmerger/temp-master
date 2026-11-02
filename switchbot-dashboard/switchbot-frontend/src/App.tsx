import { useState } from 'react';
import { downloadBackup, triggerRefresh } from './api';
import { Header } from './Header';
import { MeterPanel } from './MeterPanel';
import { ThemeProvider } from './theme';
import type { TimeScale } from './types';
import { isStaleMeter, pad2 } from './utils';
import { useDashboard } from './useDashboard';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function Dashboard() {
  const {
    meters,
    status,
    loading,
    loadError,
    connected,
    lastRefresh,
    reloadToken,
    reloadData,
  } = useDashboard();
  const [timeScale, setTimeScale] = useState<TimeScale>('day');
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const activeMeters = meters.filter((meter) => !isStaleMeter(meter));
  const staleMeters = meters.filter((meter) => isStaleMeter(meter));
  const lastRefreshText = lastRefresh
    ? `Last refresh: ${pad2(lastRefresh.getHours())}:${pad2(lastRefresh.getMinutes())}:${pad2(lastRefresh.getSeconds())}`
    : '';

  const handleRefresh = async () => {
    setActionError(null);
    setRefreshing(true);
    try {
      await triggerRefresh();
    } catch (error) {
      setActionError(`Failed to refresh: ${errorMessage(error)}`);
    } finally {
      await reloadData();
      setRefreshing(false);
    }
  };

  const handleBackup = async () => {
    setActionError(null);
    setDownloading(true);
    try {
      await downloadBackup();
    } catch (error) {
      const message = errorMessage(error);
      setActionError(
        message.startsWith('Failed to download backup')
          ? message
          : `Failed to download backup: ${message}`,
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <Header connected={connected} />
      <main className="container-fluid">
        <section className="panel controls-panel" aria-label="Dashboard controls">
          <div className="panel-body controls">
            <div className="time-range-control">
              <label htmlFor="time-scale-select">Time Range:</label>
              <select
                id="time-scale-select"
                value={timeScale}
                onChange={(event) => setTimeScale(event.target.value as TimeScale)}
              >
                <option value="hour">Last Hour</option>
                <option value="day">Last 24 Hours</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
                <option value="year">Last Year</option>
              </select>
            </div>
            <button
              className="button button-primary"
              type="button"
              onClick={() => void handleRefresh()}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
            <button
              className="button button-secondary"
              type="button"
              onClick={() => void handleBackup()}
              disabled={downloading}
            >
              {downloading ? 'Downloading...' : 'Download Backup'}
            </button>
          </div>
        </section>

        {status && (
          <section className="alert alert-info status-bar">
            <span>
              Monitoring {status.meters_count} {status.meters_count === 1 ? 'meter' : 'meters'}
            </span>
            <span>{lastRefreshText}</span>
          </section>
        )}

        {status?.is_rate_limited && (
          <section className="alert alert-warning">
            <strong>Rate Limited.</strong> SwitchBot API rate limit reached. Retry in{' '}
            {status.backoff_remaining || 0} seconds.
          </section>
        )}

        {loading && <p className="loading-message">Loading temperature data...</p>}
        {loadError && (
          <section className="alert alert-danger" role="alert">
            <strong>Error.</strong> {loadError}
          </section>
        )}
        {actionError && (
          <section className="alert alert-danger" role="alert">
            <strong>Error.</strong> {actionError}
          </section>
        )}

        <section className="meter-section" aria-label="Active meters">
          <div className="meter-grid">
            {activeMeters.map((meter) => (
              <MeterPanel
                key={meter.device_id}
                meter={meter}
                timeScale={timeScale}
                reloadToken={reloadToken}
              />
            ))}
          </div>
        </section>

        {staleMeters.length > 0 && (
          <section className="meter-section">
            <div className="meter-section-header">
              <h2 className="meter-section-title">
                <span aria-hidden="true">⚠ </span>未更新のメーター
              </h2>
              <p className="meter-section-subtitle">1週間以上更新されていないデバイス</p>
            </div>
            <div className="stale-meters-panel">
              <div className="meter-grid">
                {staleMeters.map((meter) => (
                  <MeterPanel
                    key={meter.device_id}
                    meter={meter}
                    timeScale={timeScale}
                    reloadToken={reloadToken}
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <footer className="site-footer">
        Temp Master Dashboard v2.0 - Built with React + Vite + TypeScript
      </footer>
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
