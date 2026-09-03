import { useMemo, useState } from 'react';
import { Controls } from './components/Controls';
import { ErrorAlert } from './components/ErrorAlert';
import { Footer } from './components/Footer';
import { Loading } from './components/Loading';
import { MeterGrid } from './components/MeterGrid';
import { Navbar } from './components/Navbar';
import { RateLimitWarning } from './components/RateLimitWarning';
import { StaleMetersSection } from './components/StaleMetersSection';
import { StatusBar } from './components/StatusBar';
import { useDashboardData } from './hooks/useDashboardData';
import { isStaleMeter } from './lib/stale';
import type { TimeScale } from './types';

export const App = () => {
  const [timeScale, setTimeScale] = useState<TimeScale>('day');
  const { meters, status, isLoading, error, lastRefresh, isConnected, refetch } = useDashboardData();
  const { activeMeters, staleMeters } = useMemo(() => (
    meters.reduce<{ activeMeters: typeof meters; staleMeters: typeof meters }>(
      (result, meter) => {
        if (isStaleMeter(meter)) {
          result.staleMeters.push(meter);
        } else {
          result.activeMeters.push(meter);
        }
        return result;
      },
      { activeMeters: [], staleMeters: [] },
    )
  ), [meters]);

  return (
    <>
      <Navbar isConnected={isConnected} />
      <main className="container">
        <Controls timeScale={timeScale} onTimeScaleChange={setTimeScale} refetch={refetch} />
        <StatusBar status={status} lastRefresh={lastRefresh} />
        <RateLimitWarning status={status} />
        {isLoading && <Loading />}
        {error && <ErrorAlert message={error} />}
        {!isLoading && (
          <>
            <MeterGrid meters={activeMeters} timeScale={timeScale} />
            <StaleMetersSection meters={staleMeters} timeScale={timeScale} />
          </>
        )}
        <Footer />
      </main>
    </>
  );
};
