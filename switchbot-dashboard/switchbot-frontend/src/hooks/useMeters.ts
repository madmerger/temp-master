import { useQuery } from '@tanstack/react-query';
import { fetchMeters } from '../api/client';

export function useMeters() {
  return useQuery({
    queryKey: ['meters'],
    queryFn: fetchMeters,
    refetchInterval: 30_000,
  });
}
