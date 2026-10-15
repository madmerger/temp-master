import { Download, RefreshCw } from 'lucide-react';
import type { TimeScale } from '../types';

interface ControlsPanelProps {
  timeScale: TimeScale;
  onTimeScaleChange: (timeScale: TimeScale) => void;
  onRefresh: () => void;
  onDownloadBackup: () => void;
  refreshing: boolean;
  downloading: boolean;
}

const timeScaleOptions: { value: TimeScale; label: string }[] = [
  { value: 'hour', label: 'Last Hour' },
  { value: 'day', label: 'Last 24 Hours' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'year', label: 'Last Year' },
];

export function ControlsPanel({
  timeScale,
  onTimeScaleChange,
  onRefresh,
  onDownloadBackup,
  refreshing,
  downloading,
}: ControlsPanelProps) {
  return (
    <section className="mb-5 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="time-scale-select" className="text-sm font-medium text-gray-700 dark:text-gray-200">
          Time Range:
        </label>
        <select
          id="time-scale-select"
          value={timeScale}
          onChange={(event) => onTimeScaleChange(event.target.value as TimeScale)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
        >
          {timeScaleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-700 dark:hover:bg-blue-600"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} aria-hidden="true" />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
        <button
          type="button"
          onClick={onDownloadBackup}
          disabled={downloading}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
        >
          <Download size={16} aria-hidden="true" />
          {downloading ? 'Downloading...' : 'Download Backup'}
        </button>
      </div>
    </section>
  );
}
