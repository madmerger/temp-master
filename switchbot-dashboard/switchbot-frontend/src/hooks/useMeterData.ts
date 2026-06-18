import { useState, useEffect, useCallback, useRef } from "react";
import { fetchMeters, fetchStatus, triggerRefresh } from "../api/client";
import type { MeterDevice, StatusResponse } from "../types";

const REFRESH_INTERVAL = 30_000;

interface MeterDataState {
  meters: MeterDevice[];
  status: StatusResponse | null;
  loading: boolean;
  error: string | null;
  lastRefreshedAt: Date | null;
}

export function useMeterData() {
  const [state, setState] = useState<MeterDataState>({
    meters: [],
    status: null,
    loading: true,
    error: null,
    lastRefreshedAt: null,
  });
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [metersRes, statusRes] = await Promise.all([
        fetchMeters(),
        fetchStatus(),
      ]);
      setState({
        meters: metersRes.meters,
        status: statusRes,
        loading: false,
        error: null,
        lastRefreshedAt: new Date(),
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to fetch data",
      }));
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await triggerRefresh();
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error:
          err instanceof Error ? err.message : "Failed to refresh data",
      }));
    }
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useEffect(() => {
    void loadData();
    intervalRef.current = setInterval(() => {
      void loadData();
    }, REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadData]);

  return { ...state, refreshing, handleRefresh };
}
