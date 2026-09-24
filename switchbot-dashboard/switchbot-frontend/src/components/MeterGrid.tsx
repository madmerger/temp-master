import { MeterPanel } from './MeterPanel';
import type { Meter, TimeScale } from '../types';

interface MeterGridProps {
  meters: Meter[];
  isStale: boolean;
  timeScale: TimeScale;
  refreshKey: number;
}

export function MeterGrid({ meters, isStale, timeScale, refreshKey }: MeterGridProps) {
  if (meters.length === 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
      {meters.map((m) => (
        <MeterPanel key={m.device_id} meter={m} isStale={isStale} timeScale={timeScale} refreshKey={refreshKey} />
      ))}
    </div>
  );
}
