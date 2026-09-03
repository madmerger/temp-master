import { useQuery } from '@tanstack/react-query';
import { fetchStatus } from '../api/client';
import { REFRESH_INTERVAL } from './useMeters';

export function useStatus() {
  return useQuery({
    queryKey: ['status'],
    queryFn: fetchStatus,
    refetchInterval: REFRESH_INTERVAL,
  });
}
