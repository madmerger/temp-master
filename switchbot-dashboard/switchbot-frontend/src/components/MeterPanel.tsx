import type { Meter, TimeScale } from '../types'
import { getDisplayName } from '../constants'
import MeterChart from './MeterChart'
import styles from './MeterPanel.module.css'

interface MeterPanelProps {
  meter: Meter
  timeScale: TimeScale
  refreshTick: number
  stale?: boolean
}

export default function MeterPanel({
  meter,
  timeScale,
  refreshTick,
  stale = false,
}: MeterPanelProps) {
  const {
    device_id,
    device_name,
    device_type,
    current_temperature,
    current_humidity,
    battery,
    last_updated,
  } = meter

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.title}>
          <strong>{getDisplayName(device_name)}</strong>
          {stale && <span className={styles.staleBadge}>7日以上未更新</span>}
        </div>
        <span className={styles.typeTag}>{device_type}</span>
      </div>
      <div className={styles.body}>
        <div className={styles.stats}>
          {current_temperature !== null && current_temperature !== undefined && (
            <span className={`${styles.badge} ${styles.temp}`}>
              {current_temperature}°C
            </span>
          )}
          {current_humidity !== null && current_humidity !== undefined && (
            <span className={`${styles.badge} ${styles.humidity}`}>
              {current_humidity}%
            </span>
          )}
          {battery !== null && battery !== undefined && (
            <span className={`${styles.badge} ${styles.battery}`}>{battery}%</span>
          )}
        </div>

        {stale ? (
          <p className={styles.staleEmpty}>履歴データの取得対象外</p>
        ) : (
          <MeterChart
            deviceId={device_id}
            timeScale={timeScale}
            refreshTick={refreshTick}
          />
        )}

        {last_updated ? (
          <p className={styles.lastUpdated}>
            Last updated: {new Date(last_updated).toLocaleString()}
          </p>
        ) : (
          stale && (
            <p className={styles.staleEmpty}>値がありません（データ未受信）</p>
          )
        )}
      </div>
    </div>
  )
}
