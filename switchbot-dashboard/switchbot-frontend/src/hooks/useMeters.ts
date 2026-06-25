import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  HistoryResponse,
  MeterDevice,
  StatusResponse,
  TimeScale,
} from '../types/api';

const REFRESH_INTERVAL = 30_000;

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export function useMeters() {
  const [meters, setMeters] = useState<MeterDevice[]>([]);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [metersRes, statusRes] = await Promise.all([
        fetchJson<{ meters: MeterDevice[] }>('/api/meters'),
        fetchJson<StatusResponse>('/api/status'),
      ]);
      setMeters(metersRes.meters);
      setStatus(statusRes);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, REFRESH_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  const refresh = useCallback(async () => {
    try {
      await fetchJson<{ status: string }>('/api/meters/refresh', { method: 'POST' });
      await fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to refresh');
    }
  }, [fetchData]);

  return { meters, status, loading, error, refresh };
}

export function useHistory(deviceId: string, timeScale: TimeScale) {
  const [history, setHistory] = useState<HistoryResponse | null>(null);

  useEffect(() => {
    setHistory(null);
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchJson<HistoryResponse>(
          `/api/meters/${encodeURIComponent(deviceId)}/history?time_scale=${timeScale}`,
        );
        if (!cancelled) setHistory(data);
      } catch {
        // silently ignore per-device history errors
      }
    }

    load();
    const id = setInterval(load, REFRESH_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [deviceId, timeScale]);

  return history;
}
