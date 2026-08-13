import type { Meter, TimeScale } from '../api/types'
import { MeterGrid } from './MeterGrid'

interface Props {
  meters: Meter[]
  timeScale: TimeScale
}

export function StaleMetersSection({ meters, timeScale }: Props) {
  if (!meters.length) {
    return null
  }

  return (
    <section className="mt-[38px] rounded-xl border border-warning-ink bg-warning p-[18px]">
      <div>
        <h2 className="m-0 text-lg font-semibold text-warning-ink">
          ⚠ 未更新のメーター
        </h2>
        <p className="mb-0 mt-1 text-xs text-warning-ink">
          1週間以上更新されていないデバイス
        </p>
      </div>
      <MeterGrid meters={meters} timeScale={timeScale} />
    </section>
  )
}
