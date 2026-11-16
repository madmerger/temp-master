import type { Meter, TimeScale } from '../types';
import { MeterCard } from './MeterCard';
export function MeterGrid({ meters, scale }: { meters: Meter[]; scale: TimeScale }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {meters.map((meter) => (
        <MeterCard key={meter.device_id} meter={meter} scale={scale} />
      ))}
    </div>
  );
}
