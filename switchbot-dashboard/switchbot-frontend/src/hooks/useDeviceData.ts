import { useQuery } from '@tanstack/react-query';
import { fetchMeters, fetchStatus, fetchHistory } from '../api/client';
import type { TimeScale } from '../types';

export function useMeters() {
  return useQuery({
    queryKey: ['meters'],
    queryFn: fetchMeters,
    staleTime: 10_000,
  });
}

export function useStatus() {
  return useQuery({
    queryKey: ['status'],
    queryFn: fetchStatus,
    staleTime: 10_000,
  });
}

export function useHistory(deviceId: string, timeScale: TimeScale) {
  return useQuery({
    queryKey: ['history', deviceId, timeScale],
    queryFn: () => fetchHistory(deviceId, timeScale),
    staleTime: 10_000,
    enabled: !!deviceId,
  });
}
