import { useEffect, useState } from 'react';
import { fetchHistory } from '../api/client';
import type { MeterReading, TimeScale } from '../api/types';

/** 指定デバイスの履歴を取得する。dataVersion が変わると再取得する */
export function useMeterHistory(
  deviceId: string,
  timeScale: TimeScale,
  dataVersion: number,
  enabled = true,
) {
  const [history, setHistory] = useState<MeterReading[]>([]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let cancelled = false;
    fetchHistory(deviceId, timeScale)
      .then((response) => {
        if (!cancelled) {
          setHistory(response.history ?? []);
        }
      })
      .catch(() => {
        // 個別デバイスの履歴取得失敗は全体のエラー表示に影響させない
      });
    return () => {
      cancelled = true;
    };
  }, [deviceId, timeScale, dataVersion, enabled]);

  return history;
}
