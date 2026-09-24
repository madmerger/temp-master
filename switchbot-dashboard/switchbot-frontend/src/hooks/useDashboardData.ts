import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchMeters, fetchStatus, triggerRefresh } from '../api';
import { REFRESH_INTERVAL } from '../constants';
import type { Meter, StatusResponse } from '../types';

interface DashboardData {
  meters: Meter[];
  status: StatusResponse | null;
  loading: boolean;
  error: string | null;
  connected: boolean;
  lastRefresh: Date | null;
  refreshing: boolean;
  refreshKey: number;
  refresh: () => Promise<void>;
}

export function useDashboardData(): DashboardData {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      const [metersResp, statusResp] = await Promise.all([fetchMeters(), fetchStatus()]);
      if (!mountedRef.current) return;
      setMeters(metersResp.meters ?? []);
      setStatus(statusResp);
      setConnected(true);
      setError(null);
      setLastRefresh(new Date());
      setRefreshKey((k) => k + 1);
    } catch (e) {
      if (!mountedRef.current) return;
      setError(`Failed to fetch meters/status: ${e instanceof Error ? e.message : String(e)}`);
      setConnected(false);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    const id = setInterval(fetchData, REFRESH_INTERVAL);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [fetchData]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await triggerRefresh();
    } catch (e) {
      if (mountedRef.current) {
        setError(`Failed to refresh: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    await fetchData();
    if (mountedRef.current) setRefreshing(false);
  }, [fetchData]);

  return { meters, status, loading, error, connected, lastRefresh, refreshing, refreshKey, refresh };
}
