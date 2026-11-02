import { useCallback, useRef, useState } from 'react';
import { fetchMeters, fetchStatus } from '../api';
import { REFRESH_INTERVAL_MS } from '../config';
import type { Meter, Status } from '../types';
import { usePolling } from './usePolling';

interface DashboardData {
  meters: Meter[];
  status: Status | null;
  loading: boolean;
  error: string | null;
  connected: boolean;
  lastRefresh: Date | null;
  refreshTick: number;
}

const initialState: DashboardData = {
  meters: [],
  status: null,
  loading: true,
  error: null,
  connected: false,
  lastRefresh: null,
  refreshTick: 0,
};

export function useDashboardData(): DashboardData & { reload: () => Promise<number> } {
  const [data, setData] = useState(initialState);
  const tickRef = useRef(initialState.refreshTick);

  const reload = useCallback(async () => {
    try {
      const [metersResponse, status] = await Promise.all([fetchMeters(), fetchStatus()]);
      tickRef.current += 1;
      const refreshTick = tickRef.current;
      setData((current) => ({
        ...current,
        meters: metersResponse.meters ?? [],
        status,
        loading: false,
        error: null,
        connected: true,
        lastRefresh: new Date(),
        refreshTick,
      }));
      return refreshTick;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setData((current) => ({
        ...current,
        loading: false,
        error: `Failed to fetch data: ${message}`,
        connected: false,
      }));
      return tickRef.current;
    }
  }, []);

  usePolling(reload, REFRESH_INTERVAL_MS);
  return { ...data, reload };
}
