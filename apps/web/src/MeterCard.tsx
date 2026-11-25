import { formatTimestamp, getDisplayName, type Meter, type TimeScale } from '@temp-master/shared'
import { Battery, Droplets, Thermometer } from 'lucide-react'
import { lazy, Suspense } from 'react'

const MeterChart = lazy(() => import('./MeterChart'))

interface MeterCardProps {
  meter: Meter
  timeScale: TimeScale
  stale?: boolean
}

export function MeterCard({ meter, timeScale, stale }: MeterCardProps) {
  const name = getDisplayName(meter.device_name)
  return (
    <article className="min-w-0 rounded-xl border border-line bg-surface shadow-xs">
      <header className="flex flex-wrap items-start justify-between gap-2 border-b border-line px-4 py-3.5 sm:px-5">
        <h3 className="min-w-0 font-semibold break-words">{name}</h3>
        <span className="rounded-md bg-canvas px-2 py-1 text-xs font-medium text-muted">{meter.device_type}</span>
      </header>
      <div className="px-4 pb-4 pt-3.5 sm:px-5">
        {stale && <span className="mb-3 inline-flex rounded-md bg-warning-surface px-2 py-1 text-xs font-semibold text-warning">7日以上未更新</span>}
        <dl className="grid grid-cols-3 gap-2 rounded-lg bg-canvas p-2.5 sm:p-3">
          <div>
            <dt className="flex items-center gap-1 text-xs text-muted">
              <Thermometer aria-hidden="true" className="size-3.5 text-danger" />
              Temp.
            </dt>
            <dd className="mt-1 font-semibold tabular-nums">{meter.current_temperature == null ? '—' : `${meter.current_temperature}°C`}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-xs text-muted">
              <Droplets aria-hidden="true" className="size-3.5 text-primary" />
              Humidity
            </dt>
            <dd className="mt-1 font-semibold tabular-nums">{meter.current_humidity == null ? '—' : `${meter.current_humidity}%`}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-xs text-muted">
              <Battery aria-hidden="true" className="size-3.5 text-ready" />
              Battery
            </dt>
            <dd className="mt-1 font-semibold tabular-nums">{meter.battery == null ? '—' : `${meter.battery}%`}</dd>
          </div>
        </dl>
        {stale ? (
          <p className="mt-4 text-sm text-warning">履歴データの取得対象外</p>
        ) : (
          <div className="mt-4">
            <Suspense fallback={<p className="grid h-[200px] place-items-center text-sm text-muted">Loading history…</p>}>
              <MeterChart id={meter.device_id} name={name} timeScale={timeScale} />
            </Suspense>
          </div>
        )}
        <p className="mt-3 text-xs text-muted">
          {meter.last_updated ? (
            <>Last updated: <time dateTime={meter.last_updated}>{formatTimestamp(meter.last_updated)}</time></>
          ) : '値がありません（データ未受信）'}
        </p>
      </div>
    </article>
  )
}
