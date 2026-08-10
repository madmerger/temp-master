import { API_URL } from '../api/client';
import type { TimeScale } from '../api/types';

interface Props {
  timeScale: TimeScale;
  onTimeScaleChange: (value: TimeScale) => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export default function Controls({ timeScale, onTimeScaleChange, onRefresh, refreshing }: Props) {
  return (
    <div className="mb-5 rounded border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-wrap items-center gap-3">
        <label className="font-medium" htmlFor="time-scale-select">
          Time Range:
        </label>
        <select
          id="time-scale-select"
          value={timeScale}
          onChange={(event) => onTimeScaleChange(event.target.value as TimeScale)}
          className="rounded border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
        >
          <option value="hour">Last Hour</option>
          <option value="day">Last 24 Hours</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="year">Last Year</option>
        </select>
        <button
          type="button"
          disabled={refreshing}
          onClick={onRefresh}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
        <button
          type="button"
          onClick={() => window.open(`${API_URL}/api/backup`, '_blank', 'noopener,noreferrer')}
          className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
        >
          Download Backup
        </button>
      </div>
    </div>
  );
}
