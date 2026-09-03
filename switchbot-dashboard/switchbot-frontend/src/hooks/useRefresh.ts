import { useMutation, useQueryClient } from '@tanstack/react-query';
import { triggerRefresh } from '../api/client';

export function useRefresh() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: triggerRefresh,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['meters'] });
      void queryClient.invalidateQueries({ queryKey: ['status'] });
      void queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}
