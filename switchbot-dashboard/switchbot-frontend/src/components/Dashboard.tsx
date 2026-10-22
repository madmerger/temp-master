import { useCallback, useEffect, useState } from 'react';
import {
  ApiError,
  downloadBackup,
  fetchMeters,
  fetchStatus,
  triggerRefresh,
  type BackupFile,
} from '../api/client';
import { DEFAULT_TIME_SCALE, REFRESH_INTERVAL } from '../lib/constants';
import { partitionMeters } from '../lib/meters';
import type { Meter, MetersResponse, StatusResponse, TimeScale } from '../types';
import Alert from './Alert';
import MeterGrid from './MeterGrid';
import Navbar from './Navbar';
import StaleMetersSection from './StaleMetersSection';
import StatusBar from './StatusBar';
import TimeScaleSelector from './TimeScaleSelector';
import controlStyles from './Controls.module.css';
import styles from './Dashboard.module.css';

function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : String(err);
}

function saveBlob({ blob, filename }: BackupFile): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

// ダッシュボード全体。データ取得・自動リフレッシュ・各種操作の状態を管理する
export default function Dashboard() {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [timeScale, setTimeScale] = useState<TimeScale>(DEFAULT_TIME_SCALE);
  // データ取得に成功するたびに加算し、各チャートの履歴を再取得させる
  const [reloadKey, setReloadKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const showError = useCallback((message: string) => {
    setLoading(false);
    setError(message);
    setConnected(false);
  }, []);

  // 旧実装と同じく、メーター一覧 → ステータスの順に取得し、両方成功した時点で画面を更新する
  const loadData = useCallback(async () => {
    let metersResp: MetersResponse;
    try {
      metersResp = await fetchMeters();
    } catch (err) {
      showError(`Failed to fetch meters: ${errorMessage(err)}`);
      return;
    }
    let statusResp: StatusResponse;
    try {
      statusResp = await fetchStatus();
    } catch (err) {
      showError(`Failed to fetch status: ${errorMessage(err)}`);
      return;
    }
    setMeters(metersResp?.meters ?? []);
    setStatus(statusResp);
    setLoading(false);
    setError(null);
    setConnected(true);
    setLastRefresh(new Date());
    setReloadKey((key) => key + 1);
  }, [showError]);

  useEffect(() => {
    void loadData();
    const timer = window.setInterval(() => void loadData(), REFRESH_INTERVAL);
    return () => window.clearInterval(timer);
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await triggerRefresh();
    } catch (err) {
      showError(`Failed to refresh: ${errorMessage(err)}`);
    }
    void loadData();
    setRefreshing(false);
  };

  const handleBackup = async () => {
    setDownloading(true);
    try {
      saveBlob(await downloadBackup());
    } catch (err) {
      showError(
        err instanceof ApiError ? err.message : `Failed to download backup: ${String(err)}`,
      );
    } finally {
      setDownloading(false);
    }
  };

  const { activeMeters, staleMeters } = partitionMeters(meters);

  return (
    <>
      <Navbar connected={connected} />
      <div className={styles.container}>
        <div className={controlStyles.panel}>
          <form className={controlStyles.body} onSubmit={(e) => e.preventDefault()}>
            <TimeScaleSelector value={timeScale} onChange={setTimeScale} />
            <button
              type="button"
              id="btn-refresh"
              className={`${controlStyles.button} ${controlStyles.primary}`}
              disabled={refreshing}
              onClick={() => void handleRefresh()}
            >
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
            <button
              type="button"
              id="btn-backup"
              className={`${controlStyles.button} ${controlStyles.default}`}
              disabled={downloading}
              onClick={() => void handleBackup()}
            >
              {downloading ? 'Downloading...' : 'Download Backup'}
            </button>
          </form>
        </div>

        <StatusBar status={status} lastRefresh={lastRefresh} />

        {loading && (
          <div id="loading" className={styles.loading}>
            <p className={styles.muted}>Loading temperature data...</p>
          </div>
        )}

        {error && (
          <Alert variant="danger" id="error">
            <strong>Error.</strong> <span id="error-text">{error}</span>
          </Alert>
        )}

        <div id="meters-container">
          <MeterGrid
            meters={activeMeters}
            isStale={false}
            timeScale={timeScale}
            reloadKey={reloadKey}
          />
          <StaleMetersSection meters={staleMeters} timeScale={timeScale} reloadKey={reloadKey} />
        </div>

        <footer className={styles.footer}>
          Temp Master Dashboard v2.0 - Built with React + TypeScript + Vite
        </footer>
      </div>
    </>
  );
}
