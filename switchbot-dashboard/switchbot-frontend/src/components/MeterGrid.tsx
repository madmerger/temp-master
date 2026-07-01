import type { MeterDevice, MeterReading, TimeScale } from "../api/meters";
import { MeterPanel } from "./MeterPanel";

interface MeterGridProps {
  meters: MeterDevice[];
  histories: Record<string, MeterReading[]>;
  timeScale: TimeScale;
}

export function MeterGrid({ meters, histories, timeScale }: MeterGridProps) {
  return (
    <div className="meter-grid">
      {meters.map((meter) => (
        <div key={meter.device_id} className="meter-grid-item">
          <MeterPanel
            meter={meter}
            history={histories[meter.device_id] ?? []}
            timeScale={timeScale}
          />
        </div>
      ))}
    </div>
  );
}
