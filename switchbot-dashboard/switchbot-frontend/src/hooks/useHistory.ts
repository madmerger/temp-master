import { useQuery } from '@tanstack/react-query';
import { fetchHistory } from '../api/client';
import type { TimeScale } from '../types/meter';

export function useHistory(deviceId: string, timeScale: TimeScale) {
  return useQuery({
    queryKey: ['history', deviceId, timeScale],
    queryFn: () => fetchHistory(deviceId, timeScale),
    refetchInterval: 30_000,
    enabled: !!deviceId,
  });
}
