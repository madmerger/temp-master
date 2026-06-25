import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchHistory,
  fetchMeters,
  fetchStatus,
  triggerRefresh,
  type Meter,
  type Reading,
  type StatusResponse,
  type TimeScale,
} from "../api/client";

const REFRESH_INTERVAL = 30_000;

export interface DashboardData {
  meters: Meter[];
  status: StatusResponse | null;
  history: Record<string, Reading[]>;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  connected: boolean;
  lastRefresh: Date | null;
  refresh: () => Promise<void>;
}

export function useDashboardData(timeScale: TimeScale): DashboardData {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [history, setHistory] = useState<Record<string, Reading[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const timeScaleRef = useRef(timeScale);
  timeScaleRef.current = timeScale;

  // Monotonic token so out-of-order history responses can't overwrite newer ones.
  const historyReqRef = useRef(0);

  const loadHistories = useCallback(
    async (deviceIds: string[], scale: TimeScale) => {
      const reqId = ++historyReqRef.current;
      const entries = await Promise.all(
        deviceIds.map(async (id) => {
          try {
            const res = await fetchHistory(id, scale);
            return [id, res.history] as const;
          } catch {
            return [id, [] as Reading[]] as const;
          }
        }),
      );
      if (reqId === historyReqRef.current) {
        setHistory(Object.fromEntries(entries));
      }
    },
    [],
  );

  const load = useCallback(async () => {
    // Meters are the critical data; status is supplementary. Fetch both in
    // parallel but allow the dashboard to render meters even if /api/status fails.
    const [metersResult, statusResult] = await Promise.allSettled([
      fetchMeters(),
      fetchStatus(),
    ]);

    if (statusResult.status === "fulfilled") {
      setStatus(statusResult.value);
    }

    try {
      if (metersResult.status === "rejected") {
        throw metersResult.reason;
      }
      const list = metersResult.value.meters ?? [];
      setMeters(list);
      setConnected(true);
      setError(null);
      setLastRefresh(new Date());
      await loadHistories(
        list.map((m) => m.device_id),
        timeScaleRef.current,
      );
    } catch (err) {
      setConnected(false);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [loadHistories]);

  // Initial load + polling.
  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), REFRESH_INTERVAL);
    return () => window.clearInterval(interval);
  }, [load]);

  // Re-fetch histories when the time scale changes.
  useEffect(() => {
    if (meters.length === 0) return;
    void loadHistories(
      meters.map((m) => m.device_id),
      timeScale,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeScale]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await triggerRefresh();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  return {
    meters,
    status,
    history,
    loading,
    refreshing,
    error,
    connected,
    lastRefresh,
    refresh,
  };
}
