import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchMeters, fetchStatus, triggerRefresh } from '../api/client';
import type { Meter, StatusResponse } from '../types';

const REFRESH_INTERVAL = 30000;

export interface UseMetersResult {
  meters: Meter[];
  status: StatusResponse | null;
  connected: boolean;
  loading: boolean;
  error: string | null;
  lastRefresh: Date | null;
  refreshing: boolean;
  reload: () => void;
  triggerServerRefresh: () => Promise<void>;
}

export function useMeters(): UseMetersResult {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    try {
      // Fetch meters and status in parallel.
      const [metersResp, statusResp] = await Promise.all([
        fetchMeters(),
        fetchStatus(),
      ]);
      if (!mounted.current) return;
      setMeters(metersResp.meters ?? []);
      setStatus(statusResp);
      setConnected(true);
      setError(null);
      setLastRefresh(new Date());
    } catch (err) {
      if (!mounted.current) return;
      setConnected(false);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void load();
    const id = window.setInterval(() => void load(), REFRESH_INTERVAL);
    return () => {
      mounted.current = false;
      window.clearInterval(id);
    };
  }, [load]);

  const triggerServerRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await triggerRefresh();
      await load();
    } catch (err) {
      if (mounted.current) {
        setError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      if (mounted.current) setRefreshing(false);
    }
  }, [load]);

  return {
    meters,
    status,
    connected,
    loading,
    error,
    lastRefresh,
    refreshing,
    reload: () => void load(),
    triggerServerRefresh,
  };
}
