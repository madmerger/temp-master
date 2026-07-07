import { useState, useEffect, useCallback } from 'react';
import { fetchMeters } from '../api';
import { REFRESH_INTERVAL } from '../constants';
import type { MeterDevice } from '../types';

interface UseMetersResult {
  meters: MeterDevice[];
  loading: boolean;
  error: string | null;
  connected: boolean;
  reload: () => Promise<void>;
}

export function useMeters(): UseMetersResult {
  const [meters, setMeters] = useState<MeterDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(true);

  const reload = useCallback(async () => {
    try {
      const data = await fetchMeters();
      setMeters(data.meters);
      setError(null);
      setConnected(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch meters');
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    const id = setInterval(() => void reload(), REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [reload]);

  return { meters, loading, error, connected, reload };
}
