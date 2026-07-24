import { useEffect, useRef, useState } from 'react';
import { fetchHistory } from '../api/client';
import type { HistoryPoint, TimeScale } from '../types';

// Fetches temperature history for a single meter, refetching when the device or
// time scale changes and on a periodic interval to stay in sync with the grid.
export function useHistory(
  deviceId: string,
  timeScale: TimeScale,
  refreshKey: number,
): { history: HistoryPoint[]; loading: boolean } {
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    let active = true;
    setLoading(true);
    fetchHistory(deviceId, timeScale)
      .then((resp) => {
        if (active && mounted.current) setHistory(resp.history ?? []);
      })
      .catch(() => {
        if (active && mounted.current) setHistory([]);
      })
      .finally(() => {
        if (active && mounted.current) setLoading(false);
      });
    return () => {
      active = false;
      mounted.current = false;
    };
  }, [deviceId, timeScale, refreshKey]);

  return { history, loading };
}
