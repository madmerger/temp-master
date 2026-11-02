import { useEffect, useState } from 'react';
import { fetchHistory } from '../api';
import { getDisplayName } from '../constants/displayNames';
import type { HistoryPoint, Meter, TimeScale } from '../types';
import TemperatureChart from './TemperatureChart';
import styles from './MeterCard.module.css';

interface MeterCardProps {
  meter: Meter;
  isStale: boolean;
  timeScale: TimeScale;
  refreshTick: number;
}

export default function MeterCard({
  meter,
  isStale,
  timeScale,
  refreshTick,
}: MeterCardProps) {
  const [historyState, setHistoryState] = useState<{
    key: string;
    history: HistoryPoint[];
  } | null>(null);
  const historyKey = `${meter.device_id}:${timeScale}:${refreshTick}`;

  useEffect(() => {
    if (isStale) {
      return;
    }
    const controller = new AbortController();
    void fetchHistory(meter.device_id, timeScale, controller.signal)
      .then((response) =>
        setHistoryState({ key: historyKey, history: response.history ?? [] }),
      )
      .catch(() => {
        // The legacy dashboard ignored history failures and kept the card visible.
      });
    return () => controller.abort();
  }, [historyKey, isStale, meter.device_id, refreshTick, timeScale]);
  const history = historyState?.key === historyKey ? historyState.history : [];

  return (
    <article className={styles.card}>
      <header className={styles.heading}>
        <div className={styles.title}>
          <strong>{getDisplayName(meter.device_name)}</strong>
          {isStale && <span className={styles.staleBadge}>7日以上未更新</span>}
        </div>
        <span className={styles.deviceType}>{meter.device_type}</span>
      </header>
      <div className={styles.body}>
        <div className={styles.stats}>
          {meter.current_temperature !== null && (
            <span className={styles.temperature}>{meter.current_temperature}°C</span>
          )}
          {meter.current_humidity !== null && (
            <span className={styles.humidity}>{meter.current_humidity}%</span>
          )}
          {meter.battery !== null && <span className={styles.battery}>{meter.battery}%</span>}
        </div>
        {isStale ? (
          <p className={styles.staleText}>履歴データの取得対象外</p>
        ) : (
          <div className={styles.chart}>
            <TemperatureChart history={history} timeScale={timeScale} />
          </div>
        )}
        {meter.last_updated ? (
          <p className={styles.lastUpdated}>
            Last updated: {new Date(meter.last_updated).toLocaleString()}
          </p>
        ) : (
          isStale && <p className={styles.staleText}>値がありません（データ未受信）</p>
        )}
      </div>
    </article>
  );
}
