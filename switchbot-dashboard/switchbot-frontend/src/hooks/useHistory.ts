import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchHistory } from '../api/client';
import type { TimeScale } from '../api/types';
import { REFRESH_INTERVAL } from './useMeters';

export function useHistory(deviceId: string, timeScale: TimeScale) {
  return useQuery({
    queryKey: ['history', deviceId, timeScale],
    queryFn: () => fetchHistory(deviceId, timeScale),
    refetchInterval: REFRESH_INTERVAL,
    placeholderData: keepPreviousData,
  });
}
