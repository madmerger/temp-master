import type { Meter, TimeScale } from "../types";
import { MeterCard } from "./MeterCard";

interface MeterGridProps {
  meters: Meter[];
  timeScale: TimeScale;
  refreshKey: number;
}

export function MeterGrid({ meters, timeScale, refreshKey }: MeterGridProps) {
  if (meters.length === 0) {
    return null;
  }

  return (
    <section className="meter-grid" aria-label="Active meters">
      {meters.map((meter) => (
        <MeterCard
          key={meter.device_id}
          meter={meter}
          timeScale={timeScale}
          refreshKey={refreshKey}
        />
      ))}
    </section>
  );
}
