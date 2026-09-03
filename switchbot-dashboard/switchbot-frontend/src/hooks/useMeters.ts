import { useQuery } from '@tanstack/react-query';
import { fetchMeters } from '../api/client';

export const REFRESH_INTERVAL = 30_000;

export function useMeters() {
  return useQuery({
    queryKey: ['meters'],
    queryFn: fetchMeters,
    refetchInterval: REFRESH_INTERVAL,
  });
}
