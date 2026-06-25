import { useState } from 'react';
import type { TimeScale } from '../types/api';
import { TIME_SCALE_OPTIONS } from '../types/api';
import { useMeters } from '../hooks/useMeters';
import { MeterCard } from './MeterCard';

export function Dashboard() {
  const { meters, status, loading, error, refresh } = useMeters();
  const [timeScale, setTimeScale] = useState<TimeScale>('day');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };

  const handleBackup = () => {
    window.open('/api/backup', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="fixed top-0 right-0 left-0 z-50 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900">Temp Master Dashboard</h1>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              error
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {error ? 'Disconnected' : 'Connected'}
          </span>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 pt-20 pb-8">
        {/* Controls */}
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <label htmlFor="time-scale" className="text-sm font-medium text-gray-700">
            Time Range:
          </label>
          <select
            id="time-scale"
            value={timeScale}
            onChange={(e) => setTimeScale(e.target.value as TimeScale)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            {TIME_SCALE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>

          <button
            type="button"
            onClick={handleBackup}
            className="rounded-lg border border-gray-300 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Download Backup
          </button>
        </div>

        {/* Status bar */}
        {status && (
          <div className="mb-4 flex flex-wrap items-center justify-between rounded-lg bg-blue-50 px-4 py-2.5 text-sm text-blue-800">
            <span>Monitoring {status.meters_count} meter{status.meters_count === 1 ? '' : 's'}</span>
            <span>Last refresh: {new Date().toLocaleTimeString()}</span>
          </div>
        )}

        {/* Rate limit warning */}
        {status?.is_rate_limited && (
          <div className="mb-4 rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
            <strong>Rate Limited.</strong> SwitchBot API rate limit reached.
            Retry in {status.backoff_remaining} seconds.
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="py-10 text-center text-gray-400">
            Loading temperature data...
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-800">
            <strong>Error.</strong> {error}
          </div>
        )}

        {/* Meter grid */}
        {!loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {meters.map((meter) => (
              <MeterCard key={meter.device_id} meter={meter} timeScale={timeScale} />
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-gray-400">
          Temp Master Dashboard v2.0 &mdash; React + Recharts + Tailwind CSS
        </footer>
      </main>
    </div>
  );
}
