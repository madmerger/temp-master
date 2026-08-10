import { useQuery } from '@tanstack/react-query'
import { getStatus } from '../api/client'

export const STATUS_KEY = ['status'] as const

export function useStatus() {
  return useQuery({
    queryKey: STATUS_KEY,
    queryFn: getStatus,
  })
}
