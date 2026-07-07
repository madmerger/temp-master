import { useState, useEffect, useCallback } from 'react';
import { fetchStatus } from '../api';
import { REFRESH_INTERVAL } from '../constants';
import type { StatusResponse } from '../types';

interface UseStatusResult {
  status: StatusResponse | null;
  reload: () => Promise<void>;
}

export function useStatus(): UseStatusResult {
  const [status, setStatus] = useState<StatusResponse | null>(null);

  const reload = useCallback(async () => {
    try {
      const data = await fetchStatus();
      setStatus(data);
    } catch {
      // Status fetch failure is non-critical
    }
  }, []);

  useEffect(() => {
    void reload();
    const id = setInterval(() => void reload(), REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [reload]);

  return { status, reload };
}
