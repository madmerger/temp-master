import { getDisplayName } from '../displayNames'
import type { Meter, TimeScale } from '../types'
import { isStaleMeter } from '../utils'
import type { Theme } from '../theme'
import { MeterChart } from './MeterChart'

interface MeterPanelProps {
  meter: Meter
  stale: boolean
  timeScale: TimeScale
  refreshTick: number
  theme: Theme
}

export function MeterPanel({ meter, stale, timeScale, refreshTick, theme }: MeterPanelProps) {
  const isOutdated = stale || isStaleMeter(meter)

  return (
    <article className="overflow-hidden rounded border border-border bg-panel shadow-sm">
      <header className="flex min-h-12 items-center justify-between gap-3 border-b border-border bg-panel-heading px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <strong>{getDisplayName(meter.device_name)}</strong>
          {isOutdated && (
            <span className="rounded bg-label-warning px-2 py-1 text-xs font-bold text-label-text">
              7日以上未更新
            </span>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-tag-bg px-2 py-1 text-xs text-muted">
          {meter.device_type}
        </span>
      </header>
      <div className="p-4">
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {meter.current_temperature !== null && meter.current_temperature !== undefined && (
            <span className="rounded bg-label-danger px-2 py-1 text-sm font-bold text-label-text">
              {meter.current_temperature}°C
            </span>
          )}
          {meter.current_humidity !== null && meter.current_humidity !== undefined && (
            <span className="rounded bg-label-info px-2 py-1 text-sm font-bold text-label-text">
              {meter.current_humidity}%
            </span>
          )}
          {meter.battery !== null && meter.battery !== undefined && (
            <span className="rounded bg-label-success px-2 py-1 text-sm font-bold text-label-text">
              {meter.battery}%
            </span>
          )}
        </div>
        {isOutdated ? (
          <p className="m-0 text-sm text-warning-text">履歴データの取得対象外</p>
        ) : (
          <MeterChart
            deviceId={meter.device_id}
            timeScale={timeScale}
            refreshTick={refreshTick}
            theme={theme}
          />
        )}
        {meter.last_updated ? (
          <p className="mb-0 mt-2 text-xs text-muted">
            Last updated: {new Date(meter.last_updated).toLocaleString()}
          </p>
        ) : isOutdated ? (
          <p className="mb-0 mt-2 text-sm text-warning-text">値がありません（データ未受信）</p>
        ) : null}
      </div>
    </article>
  )
}
