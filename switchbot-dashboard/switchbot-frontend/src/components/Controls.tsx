import { TIME_SCALE_OPTIONS } from '../constants'
import type { TimeScale } from '../types'

interface ControlsProps {
  timeScale: TimeScale
  refreshing: boolean
  onTimeScaleChange: (timeScale: TimeScale) => void
  onRefresh: () => void
  onBackup: () => void
}

export default function Controls({ timeScale, refreshing, onTimeScaleChange, onRefresh, onBackup }: ControlsProps) {
  return (
    <div className="mb-5 rounded border border-[#ddd] bg-white p-4 shadow-sm">
      <form className="flex flex-wrap items-center gap-3" onSubmit={(e) => e.preventDefault()}>
        <div className="mr-5 flex items-center">
          <label htmlFor="time-scale-select" className="mr-2 font-bold">
            Time Range:
          </label>
          <select
            id="time-scale-select"
            className="h-[34px] rounded border border-[#ccc] bg-white px-3 shadow-inner focus:border-[#66afe9] focus:outline-none"
            value={timeScale}
            onChange={(e) => onTimeScaleChange(e.target.value as TimeScale)}
          >
            {TIME_SCALE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          id="btn-refresh"
          className="rounded border border-[#2e6da4] bg-[#337ab7] px-3 py-1.5 text-white hover:bg-[#286090] disabled:cursor-not-allowed disabled:opacity-65"
          disabled={refreshing}
          onClick={onRefresh}
        >
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
        <button
          type="button"
          id="btn-backup"
          className="rounded border border-[#ccc] bg-white px-3 py-1.5 text-[#333] hover:bg-[#e6e6e6]"
          onClick={onBackup}
        >
          Download Backup
        </button>
      </form>
    </div>
  )
}
