import type { ReactNode } from 'react'
import { getDisplayName } from '../lib/meters'
import type { HistoryPoint, Meter, TimeScale } from '../types'
import { TemperatureChart } from './TemperatureChart'

interface Props {
  meter: Meter
  isStale: boolean
  history: HistoryPoint[]
  timeScale: TimeScale
}

function StatBadge({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span className={`rounded px-2 py-1 text-sm font-semibold text-white ${className}`}>
      {children}
    </span>
  )
}

export function MeterPanel({ meter, isStale, history, timeScale }: Props) {
  return (
    <div className="rounded border border-slate-300 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 rounded-t border-b border-slate-300 bg-slate-50 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="text-slate-900">{getDisplayName(meter.device_name)}</strong>
          {isStale && (
            <span className="rounded bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">
              7日以上未更新
            </span>
          )}
        </div>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] text-slate-600">
          {meter.device_type}
        </span>
      </div>

      <div className="px-4 py-3">
        <div className="mb-3 flex flex-wrap gap-1.5">
          {meter.current_temperature !== null && meter.current_temperature !== undefined && (
            <StatBadge className="bg-red-600">{meter.current_temperature}&deg;C</StatBadge>
          )}
          {meter.current_humidity !== null && meter.current_humidity !== undefined && (
            <StatBadge className="bg-sky-600">{meter.current_humidity}%</StatBadge>
          )}
          {meter.battery !== null && meter.battery !== undefined && (
            <StatBadge className="bg-emerald-600">{meter.battery}%</StatBadge>
          )}
        </div>

        {isStale ? (
          <p className="m-0 text-amber-700">履歴データの取得対象外</p>
        ) : (
          <TemperatureChart history={history} timeScale={timeScale} />
        )}

        {meter.last_updated ? (
          <p className="mb-0 mt-2 text-xs text-slate-500">
            Last updated: {new Date(meter.last_updated).toLocaleString()}
          </p>
        ) : (
          isStale && <p className="m-0 text-amber-700">値がありません（データ未受信）</p>
        )}
      </div>
    </div>
  )
}
