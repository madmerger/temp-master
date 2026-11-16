import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { downloadBackup, fetchMeters, fetchStatus, refreshMeters } from './api/client';
import type { TimeScale } from './types';
import { isStaleMeter } from './utils';
import { Navbar } from './components/Navbar';
import { Controls } from './components/Controls';
import { StatusBar } from './components/StatusBar';
import { ErrorAlert } from './components/ErrorAlert';
import { MeterGrid } from './components/MeterGrid';
import { StaleMetersSection } from './components/StaleMetersSection';
export default function App() {
 const [scale, setScale] = useState<TimeScale>('day');
 const client = useQueryClient();
 const meters = useQuery({ queryKey: ['meters'], queryFn: fetchMeters, refetchInterval: 30000 });
 const status = useQuery({ queryKey: ['status'], queryFn: fetchStatus, refetchInterval: 30000 });
 const refresh = useMutation({ mutationFn: refreshMeters, onSettled: async () => { await client.invalidateQueries(); } });
 const backup = useMutation({ mutationFn: downloadBackup });
 const data = meters.data?.meters ?? [];
 return <><Navbar connected={meters.isSuccess && status.isSuccess && !refresh.error && !backup.error} />
 <main className="mx-auto max-w-7xl px-6 py-8">
 <Controls scale={scale} onScale={setScale} onRefresh={() => refresh.mutate()} onBackup={() => backup.mutate()} refreshing={refresh.isPending} downloading={backup.isPending} />
 <StatusBar status={status.data} updatedAt={status.dataUpdatedAt} />
 <ErrorAlert error={meters.error?.message || status.error?.message} />
 <ErrorAlert error={refresh.error ? 'Failed to refresh: ' + refresh.error.message : null} />
 <ErrorAlert error={backup.error ? 'Failed to download backup: ' + backup.error.message : null} />
 {meters.isPending && <p className="py-10 text-center text-slate-500">Loading temperature data...</p>}
 {meters.isSuccess && !data.length && <p className="py-10 text-center text-slate-500">No meters available.</p>}
 <MeterGrid meters={data.filter(m => !isStaleMeter(m))} scale={scale} />
 <StaleMetersSection meters={data.filter(isStaleMeter)} />
 <footer className="mt-10 text-center text-xs text-slate-500">Temp Master Dashboard v1.0 - Built with React + Vite + TypeScript</footer>
 </main></>;
}
