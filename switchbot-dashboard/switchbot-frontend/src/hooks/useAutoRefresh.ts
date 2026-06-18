import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const REFRESH_INTERVAL = 30;

export function useAutoRefresh() {
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const countdownRef = useRef(REFRESH_INTERVAL);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queryClient = useQueryClient();

  const reset = useCallback(() => {
    countdownRef.current = REFRESH_INTERVAL;
    setCountdown(REFRESH_INTERVAL);
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const next = countdownRef.current - 1;
      if (next <= 0) {
        countdownRef.current = REFRESH_INTERVAL;
        setCountdown(REFRESH_INTERVAL);
        queryClient.invalidateQueries();
      } else {
        countdownRef.current = next;
        setCountdown(next);
      }
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [queryClient]);

  return { countdown, reset };
}
