import { useCallback, useEffect, useState } from 'react';
import { fetchMeters, fetchStatus } from './api';
import { REFRESH_INTERVAL_MS } from './config';
import type { DashboardStatus, Meter } from './types';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function useDashboard() {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [status, setStatus] = useState<DashboardStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [connected, setConnected] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const reloadData = useCallback(async () => {
    const [metersResult, statusResult] = await Promise.allSettled([
      fetchMeters(),
      fetchStatus(),
    ]);
    setLoading(false);

    if (metersResult.status === 'fulfilled') {
      setMeters(metersResult.value.meters ?? []);
    }
    if (statusResult.status === 'fulfilled') {
      setStatus(statusResult.value);
    }

    if (metersResult.status === 'rejected') {
      setLoadError(`Failed to fetch meters: ${errorMessage(metersResult.reason)}`);
      setConnected(false);
      return;
    }
    if (statusResult.status === 'rejected') {
      setLoadError(`Failed to fetch status: ${errorMessage(statusResult.reason)}`);
      setConnected(false);
      return;
    }

    setLoadError(null);
    setConnected(true);
    setLastRefresh(new Date());
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    void reloadData();
    const interval = window.setInterval(() => void reloadData(), REFRESH_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [reloadData]);

  return {
    meters,
    status,
    loading,
    loadError,
    connected,
    lastRefresh,
    reloadToken,
    reloadData,
  };
}
