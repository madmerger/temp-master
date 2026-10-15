import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { downloadBackup, triggerRefresh } from './api';
import { ControlsPanel } from './components/ControlsPanel';
import { ErrorAlert } from './components/ErrorAlert';
import { Loading } from './components/Loading';
import { MeterCard } from './components/MeterCard';
import { Navbar } from './components/Navbar';
import { RateLimitWarning } from './components/RateLimitWarning';
import { StaleMetersSection } from './components/StaleMetersSection';
import { StatusBar } from './components/StatusBar';
import { useDarkMode } from './hooks/useDarkMode';
import { useMetersQuery, useStatusQuery } from './hooks/useDashboardQueries';
import { isStaleMeter } from './lib/time';
import type { TimeScale } from './types';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export default function App() {
  const queryClient = useQueryClient();
  const { isDark, toggle } = useDarkMode();
  const [timeScale, setTimeScale] = useState<TimeScale>('day');
  const [actionError, setActionError] = useState<string | null>(null);
  const metersQuery = useMetersQuery();
  const statusQuery = useStatusQuery();

  const invalidateDashboard = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['meters'] }),
      queryClient.invalidateQueries({ queryKey: ['status'] }),
      queryClient.invalidateQueries({ queryKey: ['history'] }),
    ]);
  };

  const refreshMutation = useMutation({
    mutationFn: triggerRefresh,
    onSuccess: invalidateDashboard,
    onError: (error) => setActionError(`Failed to refresh: ${errorMessage(error)}`),
  });

  const backupMutation = useMutation({
    mutationFn: downloadBackup,
    onError: (error) => setActionError(errorMessage(error)),
  });

  const metersError = metersQuery.error
    ? `Failed to fetch meters: ${errorMessage(metersQuery.error)}`
    : null;
  const statusError = statusQuery.error
    ? `Failed to fetch status: ${errorMessage(statusQuery.error)}`
    : null;
  const error = actionError ?? metersError ?? statusError;
  const disconnected = Boolean(metersQuery.error || statusQuery.error);
  const status = statusQuery.data;
  const meters = metersQuery.data?.meters ?? [];
  const hasInitialError = Boolean(metersQuery.error || statusQuery.error);
  const isLoading = !hasInitialError && (metersQuery.isPending || statusQuery.isPending);
  const hasDashboardData = Boolean(metersQuery.data && statusQuery.data);
  const activeMeters = meters.filter((meter) => !isStaleMeter(meter));
  const staleMeters = meters.filter((meter) => isStaleMeter(meter));

  const startRefresh = () => {
    setActionError(null);
    refreshMutation.mutate();
  };

  const startBackup = () => {
    setActionError(null);
    backupMutation.mutate();
  };

  return (
    <>
      <Navbar disconnected={disconnected} isDark={isDark} onToggleDarkMode={toggle} />
      <main className="mx-auto min-h-screen max-w-screen-2xl px-4 pb-2 pt-20 sm:px-6">
        <ControlsPanel
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          onRefresh={startRefresh}
          onDownloadBackup={startBackup}
          refreshing={refreshMutation.isPending}
          downloading={backupMutation.isPending}
        />
        <StatusBar status={status} dataUpdatedAt={statusQuery.dataUpdatedAt} />
        <RateLimitWarning status={status} />
        {error && <ErrorAlert message={error} />}
        {isLoading && <Loading />}
        {hasDashboardData && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {activeMeters.map((meter) => (
                <MeterCard
                  key={meter.device_id}
                  meter={meter}
                  isStale={false}
                  isDark={isDark}
                  timeScale={timeScale}
                />
              ))}
            </div>
            <StaleMetersSection meters={staleMeters} isDark={isDark} timeScale={timeScale} />
          </>
        )}
        <footer className="py-8 text-center text-xs text-gray-500 dark:text-gray-400">
          Temp Master Dashboard v2.0 - Built with React + Tailwind CSS
        </footer>
      </main>
    </>
  );
}
