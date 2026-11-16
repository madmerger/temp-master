import { useQuery } from '@tanstack/react-query';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { fetchHistory } from '../api/client';
import type { Meter, TimeScale } from '../types';
import { DISPLAY_NAMES, formatTimestamp } from '../utils';
import { ErrorAlert } from './ErrorAlert';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);
export function MeterCard({ meter, scale, stale = false }: { meter: Meter; scale: TimeScale; stale?: boolean }) {
 const history = useQuery({ queryKey: ['history', meter.device_id, scale], queryFn: () => fetchHistory(meter.device_id, scale), enabled: !stale, refetchInterval: 30000 });
 const readings = history.data?.history ?? [];
 return <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
 <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-4"><h2 className="font-semibold">{DISPLAY_NAMES[meter.device_name] || meter.device_name}</h2><span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">{meter.device_type}</span>{stale && <span className="text-xs font-semibold text-amber-700">7日以上未更新</span>}</header>
 <div className="p-5"><div className="mb-4 flex flex-wrap gap-2 text-sm font-semibold">
 {meter.current_temperature != null && <span className="rounded-md bg-rose-100 px-3 py-1 text-rose-800">{meter.current_temperature}°C</span>}
 {meter.current_humidity != null && <span className="rounded-md bg-sky-100 px-3 py-1 text-sky-800">Humidity {meter.current_humidity}%</span>}
 {meter.battery != null && <span className="rounded-md bg-emerald-100 px-3 py-1 text-emerald-800">Battery {meter.battery}%</span>}</div>
 {stale ? <p className="text-sm text-amber-800">履歴データの取得対象外</p> : <>
 <ErrorAlert error={history.error?.message} />
 {history.isPending && <p className="text-sm text-slate-500">Loading history...</p>}
 <div className="h-52"><Line aria-label={`Temperature history for ${DISPLAY_NAMES[meter.device_name] || meter.device_name}`} role="img"
 data={{ labels: readings.map(r => formatTimestamp(r.timestamp, scale)), datasets: [{ label: 'Temperature (C)', data: readings.map(r => r.temperature), borderColor: '#e05260', backgroundColor: '#e0526018', fill: true, tension: 0.4, pointRadius: 2, borderWidth: 2 }] }}
 options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => context.parsed.y == null ? '' : context.parsed.y.toFixed(1) + '°C' } } }, scales: { x: { ticks: { maxTicksLimit: 8, font: { size: 10 } }, grid: { color: '#f1f5f9' } }, y: { ticks: { callback: value => value + '°' }, grid: { color: '#f1f5f9' } } } }} /></div>
 {!history.isPending && !history.error && readings.length === 0 && <p className="text-xs text-slate-500">No history available.</p>}</>}
 {meter.last_updated ? <p className="mt-4 text-xs text-slate-500">Last updated: {new Date(meter.last_updated).toLocaleString()}</p> : stale && <p className="mt-4 text-xs text-amber-800">値がありません（データ未受信）</p>}
 </div></article>;
}
