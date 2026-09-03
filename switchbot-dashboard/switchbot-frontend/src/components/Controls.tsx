import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { backupUrl, triggerRefresh } from '../api/client';
import type { TimeScale } from '../types';

const timeScaleOptions: Array<{ value: TimeScale; label: string }> = [
  { value: 'hour', label: 'Last Hour' },
  { value: 'day', label: 'Last 24 Hours' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'year', label: 'Last Year' },
];

interface ControlsProps {
  timeScale: TimeScale;
  onTimeScaleChange: (timeScale: TimeScale) => void;
  refetch: () => Promise<void>;
}

export const Controls = ({ timeScale, onTimeScaleChange, refetch }: ControlsProps) => {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      await triggerRefresh();
    } catch (error) {
      setRefreshError(`Failed to refresh: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['history'] });
      setIsRefreshing(false);
    }
  };

  return (
    <section className="panel controls-panel">
      <div className="controls-row">
        <div className="control-group">
          <label htmlFor="time-scale-select">Time Range:</label>
          <select
            id="time-scale-select"
            value={timeScale}
            onChange={(event) => onTimeScaleChange(event.target.value as TimeScale)}
          >
            {timeScaleOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <button className="button button-primary" type="button" onClick={handleRefresh} disabled={isRefreshing}>
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
        <button className="button" type="button" onClick={() => window.open(backupUrl, '_blank')}>
          Download Backup
        </button>
        {refreshError && <span className="control-error">{refreshError}</span>}
      </div>
    </section>
  );
};
