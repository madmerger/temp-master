import type { Meter, TimeScale } from '../api/types'
import { getDisplayName } from '../constants'
import { MeterChart } from './MeterChart'

interface MeterPanelProps {
  meter: Meter
  timeScale: TimeScale
}

export function MeterPanel({ meter, timeScale }: MeterPanelProps) {
  const displayName = getDisplayName(meter.device_name)
  const lastUpdated = meter.last_updated
    ? new Date(meter.last_updated).toLocaleString()
    : null

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm transition-colors">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">
          {displayName}
        </h3>
        <span className="rounded-full bg-[var(--color-badge-bg)] px-2.5 py-0.5 text-xs text-[var(--color-text-secondary)]">
          {meter.device_type}
        </span>
      </div>
      <div className="p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {meter.current_temperature !== null && (
            <span className="inline-flex items-center rounded-md bg-red-100 px-2.5 py-1 text-sm font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300 [.high-contrast_&]:bg-red-900 [.high-contrast_&]:text-red-200">
              {meter.current_temperature}&deg;C
            </span>
          )}
          {meter.current_humidity !== null && (
            <span className="inline-flex items-center rounded-md bg-cyan-100 px-2.5 py-1 text-sm font-medium text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 [.high-contrast_&]:bg-cyan-900 [.high-contrast_&]:text-cyan-200">
              {meter.current_humidity}%
            </span>
          )}
          {meter.battery !== null && (
            <span className="inline-flex items-center rounded-md bg-green-100 px-2.5 py-1 text-sm font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300 [.high-contrast_&]:bg-green-900 [.high-contrast_&]:text-green-200">
              {meter.battery}%
            </span>
          )}
        </div>
        <MeterChart deviceId={meter.device_id} timeScale={timeScale} />
        {lastUpdated && (
          <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
            Last updated: {lastUpdated}
          </p>
        )}
      </div>
    </div>
  )
}
