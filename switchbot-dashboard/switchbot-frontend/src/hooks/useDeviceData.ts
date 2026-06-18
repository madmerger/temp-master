import { useQuery } from '@tanstack/react-query';
import { fetchMeters, fetchStatus, fetchHistory } from '../api/client';
import type { TimeScale } from '../types';

const REFRESH_INTERVAL = 30_000;

export function useMeters() {
  return useQuery({
    queryKey: ['meters'],
    queryFn: fetchMeters,
    refetchInterval: REFRESH_INTERVAL,
    staleTime: 10_000,
  });
}

export function useStatus() {
  return useQuery({
    queryKey: ['status'],
    queryFn: fetchStatus,
    refetchInterval: REFRESH_INTERVAL,
    staleTime: 10_000,
  });
}

export function useHistory(deviceId: string, timeScale: TimeScale) {
  return useQuery({
    queryKey: ['history', deviceId, timeScale],
    queryFn: () => fetchHistory(deviceId, timeScale),
    refetchInterval: REFRESH_INTERVAL,
    staleTime: 10_000,
    enabled: !!deviceId,
  });
}
