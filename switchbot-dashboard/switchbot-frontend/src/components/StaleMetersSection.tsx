import type { Meter, TimeScale } from '../api/types'
import { MeterGrid } from './MeterGrid'
export function StaleMetersSection({ meters, timeScale }: { meters: Meter[]; timeScale: TimeScale }) {
  if (!meters.length) return null
  return <section className="stale-section"><div className="section-heading"><h2>⚠ 未更新のメーター</h2><p>1週間以上更新されていないデバイス</p></div><MeterGrid meters={meters} timeScale={timeScale} /></section>
}
