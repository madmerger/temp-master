import { useEffect, useState } from 'react';
import { fetchHistory } from '../api/client';
import type { MeterReading, TimeScale } from '../api/types';

interface HistoryState {
  /** readings が属するデバイスとタイムスケール */
  key: string;
  readings: MeterReading[];
}

/** 指定デバイスの履歴を取得する。dataVersion が変わると再取得する */
export function useMeterHistory(
  deviceId: string,
  timeScale: TimeScale,
  dataVersion: number,
  enabled = true,
) {
  const [state, setState] = useState<HistoryState>({ key: '', readings: [] });
  const key = `${deviceId}|${timeScale}`;

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let cancelled = false;
    fetchHistory(deviceId, timeScale)
      .then((response) => {
        if (!cancelled) {
          setState({ key, readings: response.history ?? [] });
        }
      })
      .catch(() => {
        // 個別デバイスの履歴取得失敗は全体のエラー表示に影響させない
        if (!cancelled) {
          setState({ key, readings: [] });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [deviceId, timeScale, dataVersion, enabled, key]);

  // タイムスケール変更直後に、前のスケールのデータを描画しない
  return state.key === key ? state.readings : [];
}
