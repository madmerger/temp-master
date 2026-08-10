import { useQuery } from '@tanstack/react-query';
import { fetchHistory } from '../api/client';
import type { TimeScale } from '../api/types';

export function useHistory(deviceId: string, timeScale: TimeScale, enabled = true) {
  return useQuery({
    queryKey: ['history', deviceId, timeScale],
    queryFn: () => fetchHistory(deviceId, timeScale),
    enabled,
    refetchInterval: 30000,
  });
}
