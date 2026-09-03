import { MeterPanel } from './MeterPanel';
import type { Meter, TimeScale } from '../types';

export const MeterGrid = ({ meters, timeScale }: { meters: Meter[]; timeScale: TimeScale }) => {
  if (!meters.length) {
    return null;
  }
  return (
    <div className="meter-grid">
      {meters.map((meter) => <MeterPanel key={meter.device_id} meter={meter} isStale={false} timeScale={timeScale} />)}
    </div>
  );
};
