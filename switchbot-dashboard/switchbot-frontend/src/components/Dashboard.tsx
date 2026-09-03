import { useMemo, useState } from 'react';
import type { TimeScale } from '../api/types';
import { useMeters } from '../hooks/useMeters';
import { useRefresh } from '../hooks/useRefresh';
import { useStatus } from '../hooks/useStatus';
import { isStaleMeter } from '../utils/staleMeter';
import ControlBar from './ControlBar';
import MeterGrid from './MeterGrid';
import Navbar from './Navbar';
import StaleMetersSection from './StaleMetersSection';
import StatusBar from './StatusBar';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const [timeScale, setTimeScale] = useState<TimeScale>('day');
  const metersQuery = useMeters();
  const statusQuery = useStatus();
  const refresh = useRefresh();
  const meters = metersQuery.data?.meters ?? [];
  const { activeMeters, staleMeters } = useMemo(() => {
    return meters.reduce(
      (result, meter) => {
        if (isStaleMeter(meter)) {
          result.staleMeters.push(meter);
        } else {
          result.activeMeters.push(meter);
        }
        return result;
      },
      { activeMeters: [] as typeof meters, staleMeters: [] as typeof meters },
    );
  }, [meters]);
  const connected = !metersQuery.isError && !statusQuery.isError;
  const queryError = metersQuery.error ?? statusQuery.error;
  const isInitialLoading =
    (metersQuery.isLoading && !metersQuery.data) || (statusQuery.isLoading && !statusQuery.data);

  return (
    <>
      <Navbar connected={connected} />
      <main className={styles.container}>
        <ControlBar
          timeScale={timeScale}
          onTimeScaleChange={setTimeScale}
          onRefresh={() => refresh.mutate()}
          isRefreshing={refresh.isPending}
        />
        {statusQuery.data && <StatusBar status={statusQuery.data} dataUpdatedAt={statusQuery.dataUpdatedAt} />}
        {isInitialLoading && <p className={styles.loading}>Loading temperature data...</p>}
        {queryError instanceof Error && (
          <div className={styles.errorAlert}>
            <strong>Error.</strong> Failed to fetch meters/status: {queryError.message}
          </div>
        )}
        {refresh.error instanceof Error && (
          <div className={styles.errorAlert}>
            <strong>Error.</strong> Failed to refresh: {refresh.error.message}
          </div>
        )}
        <MeterGrid meters={activeMeters} timeScale={timeScale} />
        <StaleMetersSection meters={staleMeters} timeScale={timeScale} />
        <footer>Temp Master Dashboard v1.0 - Built with React + Recharts</footer>
      </main>
    </>
  );
}
