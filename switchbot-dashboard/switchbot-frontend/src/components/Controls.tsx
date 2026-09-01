import { backupUrl } from '../api/client';
import type { TimeScale } from '../api/types';
import { TIME_SCALE_OPTIONS } from '../constants';

interface Props {
  timeScale: TimeScale;
  onTimeScaleChange: (timeScale: TimeScale) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export function Controls({ timeScale, onTimeScaleChange, onRefresh, refreshing }: Props) {
  return (
    <div className="panel mb-4">
      <div className="panel-body flex flex-wrap items-center gap-3">
        <label
          htmlFor="time-scale-select"
          className="text-sm font-medium text-slate-700 dark:text-slate-200"
        >
          Time Range:
        </label>
        <select
          id="time-scale-select"
          value={timeScale}
          onChange={(event) => onTimeScaleChange(event.target.value as TimeScale)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        >
          {TIME_SCALE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button type="button" className="btn-primary" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
        <a className="btn-default" href={backupUrl()} target="_blank" rel="noreferrer" download>
          Download Backup
        </a>
      </div>
    </div>
  );
}
