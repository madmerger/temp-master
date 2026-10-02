import { useQuery } from '@tanstack/react-query'
import { fetchHistory } from '../api/client'
import { REFRESH_INTERVAL } from '../config'
import type { TimeScale } from '../types'

export function useMeterHistory(
  deviceId: string,
  timeScale: TimeScale,
  enabled = true,
) {
  return useQuery({
    queryKey: ['history', deviceId, timeScale],
    queryFn: () => fetchHistory(deviceId, timeScale),
    enabled,
    refetchInterval: REFRESH_INTERVAL,
  })
}
