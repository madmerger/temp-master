import type { Meter } from '../types';
import { MeterCard } from './MeterCard';
export function StaleMetersSection({ meters }: { meters: Meter[] }) {
 if (!meters.length) return null;
 return <section className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5"><h2 className="text-lg font-semibold text-amber-900">未更新のメーター</h2><p className="mb-4 text-sm text-amber-800">1週間以上更新されていないデバイス</p><div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{meters.map(meter => <MeterCard key={meter.device_id} meter={meter} scale="day" stale />)}</div></section>;
}
