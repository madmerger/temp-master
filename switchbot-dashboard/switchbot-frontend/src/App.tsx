import { useState } from 'react';
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
import type { TimeScale } from './types';
import { isStaleMeter } from './utils';

export default function App() {
  const { meters, status, loading, error, connected, lastRefresh, refreshing, refreshKey, refresh } =
    useDashboardData();
  const [timeScale, setTimeScale] = useState<TimeScale>('day');

  const activeMeters = meters.filter((m) => !isStaleMeter(m));
  const staleMeters = meters.filter(isStaleMeter);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <Navbar connected={connected} />
      <div className="max-w-7xl mx-auto px-4 pt-20 pb-4">
        <Controls
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          refreshing={refreshing}
          onRefresh={() => void refresh()}
        />
        {status && <StatusBar status={status} lastRefresh={lastRefresh} />}
        {status && <RateLimitWarning status={status} />}
        {loading && meters.length === 0 && <Loading />}
        {error && <ErrorAlert message={error} />}
        <MeterGrid meters={activeMeters} isStale={false} timeScale={timeScale} refreshKey={refreshKey} />
        <StaleMetersSection meters={staleMeters} timeScale={timeScale} refreshKey={refreshKey} />
        <Footer />
      </div>
    </div>
  );
}
