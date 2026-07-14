import type { Meter, TimeScale } from '../types'
import MeterPanel from './MeterPanel'
import gridStyles from './MeterGrid.module.css'
import styles from './StaleMetersSection.module.css'

interface StaleMetersSectionProps {
  meters: Meter[]
  timeScale: TimeScale
  refreshTick: number
}

export default function StaleMetersSection({
  meters,
  timeScale,
  refreshTick,
}: StaleMetersSectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <span aria-hidden="true">⚠️</span> 未更新のメーター
        </h3>
        <p className={styles.subtitle}>1週間以上更新されていないデバイス</p>
      </div>
      <div className={styles.wrapper}>
        <div className={gridStyles.grid}>
          {meters.map((meter) => (
            <MeterPanel
              key={meter.device_id}
              meter={meter}
              timeScale={timeScale}
              refreshTick={refreshTick}
              stale
            />
          ))}
        </div>
      </div>
    </section>
  )
}
