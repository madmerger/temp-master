import type { Meter, TimeScale } from '../api/types';
import MeterPanel from './MeterPanel';

interface Props {
  meters: Meter[];
  timeScale: TimeScale;
}

export default function MeterGrid({ meters, timeScale }: Props) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
      {meters.map((meter) => (
        <MeterPanel key={meter.device_id} meter={meter} timeScale={timeScale} />
      ))}
    </div>
  );
}
