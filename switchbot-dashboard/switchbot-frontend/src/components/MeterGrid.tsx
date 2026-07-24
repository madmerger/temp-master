import type { Meter, TimeScale } from '../types';
import MeterCard from './MeterCard';

interface Props {
  meters: Meter[];
  timeScale: TimeScale;
  refreshKey: number;
}

export default function MeterGrid({ meters, timeScale, refreshKey }: Props) {
  if (!meters.length) return null;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {meters.map((meter) => (
        <MeterCard
          key={meter.device_id}
          meter={meter}
          timeScale={timeScale}
          refreshKey={refreshKey}
        />
      ))}
    </div>
  );
}
