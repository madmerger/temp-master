import type { Meter, TimeScale } from '../api/types';
import MeterPanel from './MeterPanel';
export default function StaleMetersSection({ meters, timeScale }: { meters: Meter[]; timeScale: TimeScale }) {
  if (!meters.length) return null;
  return <section className="mt-6"><div className="mb-2"><h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300">⚠ 未更新のメーター</h2><p className="text-xs text-yellow-800 dark:text-yellow-300">1週間以上更新されていないデバイス</p></div><div className="rounded border border-yellow-300 bg-yellow-50 p-5 dark:border-yellow-700 dark:bg-yellow-950"><div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">{meters.map((meter) => <MeterPanel key={meter.device_id} meter={meter} timeScale={timeScale} stale />)}</div></div></section>;
}
