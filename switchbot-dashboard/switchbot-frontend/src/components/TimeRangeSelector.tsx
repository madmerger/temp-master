import type { TimeScale } from '../api/types'
import { TIME_SCALE_OPTIONS } from '../constants'

interface TimeRangeSelectorProps {
  value: TimeScale
  onChange: (scale: TimeScale) => void
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="time-scale-select"
        className="text-sm font-medium text-[var(--color-text)]"
      >
        Time Range:
      </label>
      <select
        id="time-scale-select"
        value={value}
        onChange={(e) => onChange(e.target.value as TimeScale)}
        className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
      >
        {TIME_SCALE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
