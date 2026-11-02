import { useCallback, useState } from 'react';
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

export function useDashboardData(): DashboardData & { reload: () => Promise<boolean> } {
  const [data, setData] = useState(initialState);

  const reload = useCallback(async () => {
    try {
      const [metersResponse, status] = await Promise.all([fetchMeters(), fetchStatus()]);
      setData((current) => ({
        ...current,
        meters: metersResponse.meters ?? [],
        status,
        loading: false,
        error: null,
        connected: true,
        lastRefresh: new Date(),
        refreshTick: current.refreshTick + 1,
      }));
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setData((current) => ({
        ...current,
        loading: false,
        error: `Failed to fetch data: ${message}`,
        connected: false,
      }));
      return false;
    }
  }, []);

  usePolling(reload, REFRESH_INTERVAL_MS);
  return { ...data, reload };
}
