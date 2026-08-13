import { useQuery } from '@tanstack/react-query'
import { fetchHistory } from '../api/client'
import type { Meter, TimeScale } from '../api/types'
import { getDisplayName, isStaleMeter } from '../utils/meter'
import { TemperatureChart } from './TemperatureChart'

export function MeterCard({ meter, timeScale }: { meter: Meter; timeScale: TimeScale }) {
  const stale = isStaleMeter(meter)
  const history = useQuery({
    queryKey: ['history', meter.device_id, timeScale],
    queryFn: () => fetchHistory(meter.device_id, timeScale),
    enabled: !stale,
    staleTime: 25_000,
    refetchInterval: 30_000,
  })

  return (
    <article className="min-w-0 rounded-xl border border-border bg-surface-raised p-[18px] shadow-[0_5px_18px_rgb(0_0_0_/_5%)]">
      <header className="flex items-start justify-between gap-3 border-b border-border pb-3">
        <div>
          <h3 className="m-0 text-base font-semibold">
            {getDisplayName(meter.device_name)}
          </h3>
          {stale && (
            <span className="mt-1 inline-block rounded-full border border-warning-ink px-2 py-1 text-[.7rem] text-warning-ink">
              7日以上未更新
            </span>
          )}
        </div>
        <span className="whitespace-nowrap text-xs text-muted">{meter.device_type}</span>
      </header>
      <div className="flex flex-wrap gap-2 pb-0 pt-3">
        {meter.current_temperature != null && (
          <span className="rounded bg-danger px-2.5 py-1 text-sm font-bold text-white">
            {meter.current_temperature}°C
          </span>
        )}
        {meter.current_humidity != null && (
          <span className="rounded bg-[#2784b8] px-2.5 py-1 text-sm font-bold text-white">
            {meter.current_humidity}%
          </span>
        )}
        {meter.battery != null && (
          <span className="rounded bg-success px-2.5 py-1 text-sm font-bold text-white">
            {meter.battery}%
          </span>
        )}
      </div>
      {stale ? (
        <p className="text-sm text-warning-ink">履歴データの取得対象外</p>
      ) : history.isLoading ? (
        <div className="grid h-[200px] place-items-center text-muted">
          Loading history...
        </div>
      ) : (
        <TemperatureChart
          history={history.data?.history || []}
          timeScale={timeScale}
        />
      )}
      {meter.last_updated ? (
        <p className="mb-0 mt-2 text-xs text-muted">
          Last updated: {new Date(meter.last_updated).toLocaleString()}
        </p>
      ) : (
        stale && <p className="text-sm text-warning-ink">値がありません（データ未受信）</p>
      )}
    </article>
  )
}
