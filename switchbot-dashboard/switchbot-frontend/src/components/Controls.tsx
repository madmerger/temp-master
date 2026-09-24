import { backupUrl } from '../api';
import { TIME_SCALES } from '../constants';
import type { TimeScale } from '../types';

interface ControlsProps {
  timeScale: TimeScale;
  onTimeScaleChange: (scale: TimeScale) => void;
  refreshing: boolean;
  onRefresh: () => void;
}

export function Controls({ timeScale, onTimeScaleChange, refreshing, onRefresh }: ControlsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-4 mb-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="time-scale-select" className="text-sm text-gray-700 dark:text-gray-300">
            Time Range:
          </label>
          <select
            id="time-scale-select"
            value={timeScale}
            onChange={(e) => onTimeScaleChange(e.target.value as TimeScale)}
            className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            {TIME_SCALES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="px-3 py-1.5 rounded text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
        <button
          type="button"
          onClick={() => window.open(backupUrl(), '_blank')}
          className="px-3 py-1.5 rounded text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Download Backup
        </button>
      </div>
    </div>
  );
}
