import { useEffect, useRef } from 'react';

export function usePolling(callback: () => unknown, intervalMs: number): void {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    void callbackRef.current();
    const interval = window.setInterval(() => {
      void callbackRef.current();
    }, intervalMs);
    return () => window.clearInterval(interval);
  }, [intervalMs]);
}
