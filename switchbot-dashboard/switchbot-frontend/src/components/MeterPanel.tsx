import { getDisplayName } from '../lib/displayNames';
import type { Meter, TimeScale } from '../types';
import Badge from './Badge';
import TemperatureChart from './TemperatureChart';
import styles from './MeterPanel.module.css';

interface MeterPanelProps {
  meter: Meter;
  isStale: boolean;
  timeScale: TimeScale;
  reloadKey: number;
}

function hasValue(value: number | null | undefined): value is number {
  return value !== null && value !== undefined;
}

// メーター1台分のパネル（名称・現在値バッジ・温度チャート・最終更新時刻）
export default function MeterPanel({ meter, isStale, timeScale, reloadKey }: MeterPanelProps) {
  return (
    <div className={styles.panel} data-testid="meter-panel" data-device-id={meter.device_id}>
      <div className={styles.heading}>
        <div className={styles.header}>
          <div className={styles.title}>
            <strong>{getDisplayName(meter.device_name)}</strong>
            {isStale && (
              <Badge variant="warning" className={styles.staleBadge}>
                7日以上未更新
              </Badge>
            )}
          </div>
          <span className={styles.deviceType}>{meter.device_type}</span>
        </div>
      </div>
      <div className={styles.body}>
        <div className={styles.stats}>
          {hasValue(meter.current_temperature) && (
            <Badge variant="danger" className={styles.stat}>
              {meter.current_temperature}
              {'\u00b0C'}
            </Badge>
          )}
          {hasValue(meter.current_humidity) && (
            <Badge variant="info" className={styles.stat}>
              {meter.current_humidity}%
            </Badge>
          )}
          {hasValue(meter.battery) && (
            <Badge variant="success" className={styles.stat}>
              {meter.battery}%
            </Badge>
          )}
        </div>
        {isStale ? (
          <p className={styles.staleEmpty}>履歴データの取得対象外</p>
        ) : (
          <TemperatureChart
            deviceId={meter.device_id}
            timeScale={timeScale}
            reloadKey={reloadKey}
          />
        )}
        {meter.last_updated ? (
          <p className={styles.lastUpdated}>
            Last updated: {new Date(meter.last_updated).toLocaleString()}
          </p>
        ) : (
          isStale && <p className={styles.staleEmpty}>値がありません（データ未受信）</p>
        )}
      </div>
    </div>
  );
}
