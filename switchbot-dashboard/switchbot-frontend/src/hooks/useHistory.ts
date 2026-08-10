import { useQuery } from '@tanstack/react-query'
import { getHistory } from '../api/client'
import type { TimeScale } from '../api/types'

export function useHistory(deviceId: string, timeScale: TimeScale) {
  return useQuery({
    queryKey: ['history', deviceId, timeScale] as const,
    queryFn: () => getHistory(deviceId, timeScale),
    enabled: !!deviceId,
  })
}
