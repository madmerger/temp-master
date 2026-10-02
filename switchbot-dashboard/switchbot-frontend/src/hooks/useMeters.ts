import { useQuery } from '@tanstack/react-query'
import { fetchMeters } from '../api/client'
import { REFRESH_INTERVAL } from '../config'

export function useMeters() {
  return useQuery({
    queryKey: ['meters'],
    queryFn: fetchMeters,
    refetchInterval: REFRESH_INTERVAL,
  })
}
