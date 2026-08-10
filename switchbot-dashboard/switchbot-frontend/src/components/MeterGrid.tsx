import type { Meter, TimeScale } from '../api/types';
import MeterPanel from './MeterPanel';
export default function MeterGrid({ meters, timeScale }: { meters: Meter[]; timeScale: TimeScale }) {
  return <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">{meters.map((meter) => <MeterPanel key={meter.device_id} meter={meter} timeScale={timeScale} />)}</div>;
}
