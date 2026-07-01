import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchMeters,
  fetchStatus,
  fetchHistory,
  triggerRefresh,
  type MeterDevice,
  type StatusResponse,
  type MeterReading,
  type TimeScale,
} from "../api/meters";
import { API_URL, REFRESH_INTERVAL } from "../config/api";

interface MetersState {
  meters: MeterDevice[];
  status: StatusResponse | null;
  histories: Record<string, MeterReading[]>;
  loading: boolean;
  error: string | null;
  connected: boolean;
  refreshing: boolean;
  timeScale: TimeScale;
  lastRefreshed: Date | null;
}

export function useMeters() {
  const [state, setState] = useState<MetersState>({
    meters: [],
    status: null,
    histories: {},
    loading: true,
    error: null,
    connected: false,
    refreshing: false,
    timeScale: "day",
    lastRefreshed: null,
  });

  const timeScaleRef = useRef(state.timeScale);
  timeScaleRef.current = state.timeScale;

  const loadData = useCallback(async () => {
    try {
      const [metersResp, statusResp] = await Promise.all([
        fetchMeters(),
        fetchStatus(),
      ]);

      const meters = metersResp.meters;

      const historyResults = await Promise.all(
        meters.map((m) =>
          fetchHistory(m.device_id, timeScaleRef.current).catch(() => ({
            device_id: m.device_id,
            time_scale: timeScaleRef.current,
            history: [] as MeterReading[],
            device: null,
          })),
        ),
      );

      const histories: Record<string, MeterReading[]> = {};
      for (const result of historyResults) {
        histories[result.device_id] = result.history;
      }

      setState((prev) => ({
        ...prev,
        meters,
        status: statusResp,
        histories,
        loading: false,
        error: null,
        connected: true,
        lastRefreshed: new Date(),
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch data";
      setState((prev) => ({
        ...prev,
        loading: false,
        error: message,
        connected: false,
      }));
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [loadData]);

  const setTimeScale = useCallback(
    (scale: TimeScale) => {
      setState((prev) => ({ ...prev, timeScale: scale }));
      timeScaleRef.current = scale;
      loadData();
    },
    [loadData],
  );

  const handleRefresh = useCallback(async () => {
    setState((prev) => ({ ...prev, refreshing: true }));
    try {
      await triggerRefresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to refresh";
      setState((prev) => ({ ...prev, error: message }));
    }
    await loadData();
    setState((prev) => ({ ...prev, refreshing: false }));
  }, [loadData]);

  const handleBackup = useCallback(() => {
    window.open(`${API_URL}/api/backup`, "_blank");
  }, []);

  return {
    ...state,
    setTimeScale,
    handleRefresh,
    handleBackup,
  };
}
