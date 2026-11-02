import { STALE_METER_THRESHOLD_MS } from '../config'
import { getDisplayName } from '../constants/displayNames'
import type { Meter, TimeScale } from '../types'
import { formatStaleThreshold } from '../utils/format'
import { TemperatureChart } from './TemperatureChart'
import styles from './MeterCard.module.css'

interface MeterCardProps {
  meter: Meter
  isStale: boolean
  timeScale: TimeScale
  refreshToken: number
}

export function MeterCard({
  meter,
  isStale,
  timeScale,
  refreshToken,
}: MeterCardProps) {
  return (
    <article
      className={styles.panel}
      data-testid="meter-card"
      data-device-id={meter.device_id}
    >
      <header className={styles.heading}>
        <div className={styles.title}>
          <strong>{getDisplayName(meter.device_name)}</strong>
          {isStale && (
            <span className={styles.staleBadge}>
              {formatStaleThreshold(STALE_METER_THRESHOLD_MS)}以上未更新
            </span>
          )}
        </div>
        <span className={styles.deviceType}>{meter.device_type}</span>
      </header>
      <div className={styles.body}>
        <div className={styles.stats}>
          {meter.current_temperature !== null && (
            <span className={`${styles.badge} ${styles.danger}`}>
              {meter.current_temperature}°C
            </span>
          )}
          {meter.current_humidity !== null && (
            <span className={`${styles.badge} ${styles.info}`}>
              {meter.current_humidity}%
            </span>
          )}
          {meter.battery !== null && (
            <span className={`${styles.badge} ${styles.success}`}>
              {meter.battery}%
            </span>
          )}
        </div>
        {isStale ? (
          <p className={styles.staleMessage}>履歴データの取得対象外</p>
        ) : (
          <div className={styles.chartWrap}>
            <TemperatureChart
              deviceId={meter.device_id}
              timeScale={timeScale}
              refreshToken={refreshToken}
            />
          </div>
        )}
        {meter.last_updated ? (
          <p className={styles.lastUpdated}>
            Last updated: {new Date(meter.last_updated).toLocaleString()}
          </p>
        ) : (
          isStale && (
            <p className={styles.staleMessage}>値がありません（データ未受信）</p>
          )
        )}
      </div>
    </article>
  )
}
