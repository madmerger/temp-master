import type { Meter, TimeScale } from '../types'
import { MeterCard } from './MeterCard'
import styles from './StaleMetersSection.module.css'

interface StaleMetersSectionProps {
  meters: Meter[]
  timeScale: TimeScale
  refreshToken: number
}

export function StaleMetersSection({
  meters,
  timeScale,
  refreshToken,
}: StaleMetersSectionProps) {
  if (meters.length === 0) {
    return null
  }

  return (
    <section className={styles.section} aria-labelledby="stale-title">
      <div className={styles.header}>
        <h2 className={styles.title} id="stale-title">
          <span aria-hidden="true">⚠</span> 未更新のメーター
        </h2>
        <p className={styles.subtitle}>1週間以上更新されていないデバイス</p>
      </div>
      <div className={styles.panel}>
        <div className={styles.grid}>
          {meters.map((meter) => (
            <MeterCard
              key={meter.device_id}
              meter={meter}
              isStale
              timeScale={timeScale}
              refreshToken={refreshToken}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
