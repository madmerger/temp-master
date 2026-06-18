import { useQuery } from '@tanstack/react-query';
import { fetchStatus } from '../api/client';

export function useStatus() {
  return useQuery({
    queryKey: ['status'],
    queryFn: fetchStatus,
    refetchInterval: 30_000,
  });
}
