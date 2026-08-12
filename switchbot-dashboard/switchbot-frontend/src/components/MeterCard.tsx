import type { MeterDevice, MeterReading, TimeScale } from '../types'
import { TemperatureChart } from './TemperatureChart'

interface MeterCardProps {
  meter: MeterDevice & { displayName: string }
  history: MeterReading[]
  timeScale: TimeScale
  darkMode: boolean
  stale: boolean
  historyLoading: boolean
}

export function MeterCard({ meter, history, timeScale, darkMode, stale, historyLoading }: MeterCardProps) {
  return (
    <article className={`overflow-hidden rounded-2xl border shadow-lg ${stale ? 'border-amber-300 bg-amber-50 dark:border-amber-700/70 dark:bg-amber-950/30' : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'}`}>
      <header className={`flex items-start justify-between gap-3 border-b px-5 py-4 ${stale ? 'border-amber-200 dark:border-amber-800/60' : 'border-slate-100 dark:border-slate-700'}`}>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-slate-900 dark:text-white">{meter.displayName}</h3>
          {stale && <span className="rounded-full bg-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-800 dark:text-amber-100">7日以上未更新</span>}
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500 dark:bg-slate-700 dark:text-slate-300">{meter.device_type}</span>
      </header>
      <div className="px-5 py-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {meter.current_temperature !== null && <span className="rounded-md bg-red-100 px-2.5 py-1 text-sm font-medium text-red-700 dark:bg-red-950/60 dark:text-red-300">{meter.current_temperature}°C</span>}
          {meter.current_humidity !== null && <span className="rounded-md bg-cyan-100 px-2.5 py-1 text-sm font-medium text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300">{meter.current_humidity}%</span>}
          {meter.battery !== null && <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-sm font-medium text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">{meter.battery}%</span>}
        </div>
        {stale ? <p className="py-8 text-sm text-amber-800 dark:text-amber-200">履歴データの取得対象外</p> : <TemperatureChart history={history} timeScale={timeScale} darkMode={darkMode} isLoading={historyLoading} />}
        {meter.last_updated ? <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Last updated: {new Date(meter.last_updated).toLocaleString()}</p> : stale ? <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">値がありません（データ未受信）</p> : null}
      </div>
    </article>
  )
}
