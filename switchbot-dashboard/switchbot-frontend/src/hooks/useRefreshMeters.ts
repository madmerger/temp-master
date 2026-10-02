import { useMutation, useQueryClient } from '@tanstack/react-query'
import { triggerRefresh } from '../api/client'

export function useRefreshMeters() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: triggerRefresh,
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['meters'] }),
        queryClient.invalidateQueries({ queryKey: ['status'] }),
        queryClient.invalidateQueries({ queryKey: ['history'] }),
      ])
    },
  })
}
