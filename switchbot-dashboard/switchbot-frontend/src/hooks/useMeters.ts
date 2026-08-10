import { useQuery } from '@tanstack/react-query'
import { getMeters } from '../api/client'

export const METERS_KEY = ['meters'] as const

export function useMeters() {
  return useQuery({
    queryKey: METERS_KEY,
    queryFn: getMeters,
  })
}
