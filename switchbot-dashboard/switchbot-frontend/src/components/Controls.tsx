import type { TimeScale } from '../types';
export function Controls({
  scale,
  onScale,
  onRefresh,
  onBackup,
  refreshing,
  downloading,
}: {
  scale: TimeScale;
  onScale: (scale: TimeScale) => void;
  onRefresh: () => void;
  onBackup: () => void;
  refreshing: boolean;
  downloading: boolean;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <label htmlFor="time-range" className="text-sm font-semibold">
        Time Range:
      </label>
      <select id="time-range" value={scale} onChange={(e) => onScale(e.target.value as TimeScale)}>
        {(
          [
            ['hour', 'Last Hour'],
            ['day', 'Last 24 Hours'],
            ['week', 'Last 7 Days'],
            ['month', 'Last 30 Days'],
            ['year', 'Last Year'],
          ] as const
        ).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <button onClick={onRefresh} disabled={refreshing}>
        {refreshing ? 'Refreshing...' : 'Refresh Data'}
      </button>
      <button onClick={onBackup} disabled={downloading}>
        {downloading ? 'Downloading...' : 'Download Backup'}
      </button>
    </div>
  );
}
