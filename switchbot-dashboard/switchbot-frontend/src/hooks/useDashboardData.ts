import { useQuery } from '@tanstack/react-query';
import { fetchMeters, fetchStatus } from '../api/client';
import { REFRESH_INTERVAL } from '../config';
import type { Meter, StatusResponse } from '../types';

export const useDashboardData = () => {
  const metersQuery = useQuery({
    queryKey: ['meters'],
    queryFn: fetchMeters,
    refetchInterval: REFRESH_INTERVAL,
  });
  const statusQuery = useQuery({
    queryKey: ['status'],
    queryFn: fetchStatus,
    refetchInterval: REFRESH_INTERVAL,
  });

  const firstError = metersQuery.error
    ? `Failed to fetch meters: ${metersQuery.error.message}`
    : statusQuery.error
      ? `Failed to fetch status: ${statusQuery.error.message}`
      : null;
  const pairUpdatedAt =
    metersQuery.dataUpdatedAt > 0 && statusQuery.dataUpdatedAt > 0
      ? Math.min(metersQuery.dataUpdatedAt, statusQuery.dataUpdatedAt)
      : 0;

  return {
    meters: metersQuery.data?.meters ?? ([] as Meter[]),
    status: statusQuery.data as StatusResponse | undefined,
    isLoading: metersQuery.isPending || statusQuery.isPending,
    error: firstError,
    lastRefresh: pairUpdatedAt ? new Date(pairUpdatedAt) : null,
    isConnected: !metersQuery.error && !statusQuery.error,
    refetch: async () => {
      await Promise.all([metersQuery.refetch(), statusQuery.refetch()]);
    },
  };
};
