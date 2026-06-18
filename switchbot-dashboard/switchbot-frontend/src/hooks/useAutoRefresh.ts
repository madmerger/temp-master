import { useState, useEffect, useCallback, useRef } from 'react';

const REFRESH_INTERVAL = 30;

export function useAutoRefresh() {
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = useCallback(() => {
    setCountdown(REFRESH_INTERVAL);
  }, []);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) return REFRESH_INTERVAL;
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { countdown, reset };
}
