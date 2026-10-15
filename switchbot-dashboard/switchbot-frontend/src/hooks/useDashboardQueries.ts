import { useQuery } from '@tanstack/react-query';
import { fetchHistory, fetchMeters, fetchStatus } from '../api';
import type { TimeScale } from '../types';

const REFRESH_INTERVAL_MS = 30_000;

export function useMetersQuery() {
  return useQuery({
    queryKey: ['meters'],
    queryFn: fetchMeters,
    refetchInterval: REFRESH_INTERVAL_MS,
    retry: false,
  });
}

export function useStatusQuery() {
  return useQuery({
    queryKey: ['status'],
    queryFn: fetchStatus,
    refetchInterval: REFRESH_INTERVAL_MS,
    retry: false,
  });
}

export function useHistoryQuery(id: string, timeScale: TimeScale, enabled = true) {
  return useQuery({
    queryKey: ['history', id, timeScale],
    queryFn: () => fetchHistory(id, timeScale),
    refetchInterval: REFRESH_INTERVAL_MS,
    enabled,
    retry: false,
  });
}
