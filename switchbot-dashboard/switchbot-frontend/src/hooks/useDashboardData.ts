import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchMeters, fetchStatus, triggerRefresh } from '../api/client';
import type { MeterDevice, StatusResponse } from '../api/types';
import { REFRESH_INTERVAL } from '../constants';

interface DashboardData {
  meters: MeterDevice[];
  status: StatusResponse | null;
  /** メーター一覧が更新されるたびに増える。履歴の再取得トリガーとして使う */
  dataVersion: number;
  loading: boolean;
  error: string | null;
  connected: boolean;
  lastRefresh: Date | null;
  refreshing: boolean;
  reload: () => Promise<void>;
  manualRefresh: () => Promise<void>;
}

export function useDashboardData(): DashboardData {
  const [meters, setMeters] = useState<MeterDevice[]>([]);
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [dataVersion, setDataVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const mounted = useRef(true);
  // 並行した取得のうち、最後に開始したものだけを反映する
  const latestRequest = useRef(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    const requestId = ++latestRequest.current;
    try {
      const [metersResponse, statusResponse] = await Promise.all([fetchMeters(), fetchStatus()]);
      if (!mounted.current || requestId !== latestRequest.current) return;
      setMeters(metersResponse.meters ?? []);
      setStatus(statusResponse);
      setDataVersion((version) => version + 1);
      setLastRefresh(new Date());
      setError(null);
      setConnected(true);
    } catch (err) {
      if (!mounted.current || requestId !== latestRequest.current) return;
      setError(`データの取得に失敗しました: ${err instanceof Error ? err.message : String(err)}`);
      setConnected(false);
    } finally {
      if (mounted.current && requestId === latestRequest.current) {
        setLoading(false);
      }
    }
  }, []);

  const manualRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await triggerRefresh();
    } catch (err) {
      if (mounted.current) {
        setError(`更新に失敗しました: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    await reload();
    if (mounted.current) {
      setRefreshing(false);
    }
  }, [reload]);

  useEffect(() => {
    // 初回取得と 30 秒ごとの自動更新。非同期完了後に state を更新するため同期的な再描画は起きない
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
    const timer = setInterval(() => void reload(), REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [reload]);

  return {
    meters,
    status,
    dataVersion,
    loading,
    error,
    connected,
    lastRefresh,
    refreshing,
    reload,
    manualRefresh,
  };
}
