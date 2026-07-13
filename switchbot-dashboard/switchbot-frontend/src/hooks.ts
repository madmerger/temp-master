import { useCallback, useEffect, useState } from "react";
import {
  fetchHistory,
  fetchMeters,
  fetchStatus,
  triggerRefresh,
  type HistoryPoint,
  type Meter,
  type StatusResponse,
  type TimeScale,
} from "./api";
import { REFRESH_INTERVAL } from "./constants";

export interface DashboardData {
  meters: Meter[];
  status: StatusResponse | null;
  connected: boolean;
  loading: boolean;
  error: string | null;
  lastRefresh: Date | null;
  refreshing: boolean;
  /** Re-fetch meters + status from cache (used by the polling interval). */
  reload: () => Promise<void>;
  /** Trigger a backend data collection, then reload. */
  triggerAndReload: () => Promise<void>;
}

export function useDashboardData(): DashboardData {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [connected, setConnected] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const reload = useCallback(async () => {
    try {
      const metersResp = await fetchMeters();
      const statusResp = await fetchStatus();
      setMeters(metersResp.meters ?? []);
      setStatus(statusResp);
      setConnected(true);
      setError(null);
      setLastRefresh(new Date());
    } catch (err) {
      setConnected(false);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerAndReload = useCallback(async () => {
    setRefreshing(true);
    try {
      await triggerRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      await reload();
      setRefreshing(false);
    }
  }, [reload]);

  useEffect(() => {
    void reload();
    const id = window.setInterval(() => {
      void reload();
    }, REFRESH_INTERVAL);
    return () => window.clearInterval(id);
  }, [reload]);

  return {
    meters,
    status,
    connected,
    loading,
    error,
    lastRefresh,
    refreshing,
    reload,
    triggerAndReload,
  };
}

export interface HistoryState {
  history: HistoryPoint[];
  loading: boolean;
  error: string | null;
}

export function useHistory(
  deviceId: string,
  timeScale: TimeScale,
  enabled: boolean,
  refreshKey: number,
): HistoryState {
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!enabled) {
      setHistory([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchHistory(deviceId, timeScale)
      .then((resp) => {
        if (cancelled) return;
        setHistory(resp.history ?? []);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [deviceId, timeScale, enabled, refreshKey]);

  return { history, loading, error };
}
