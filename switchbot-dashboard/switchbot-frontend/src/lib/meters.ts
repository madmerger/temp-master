import type { Meter } from '../types';
import { STALE_METER_THRESHOLD_MS } from './constants';

// last_updated が無い・不正・閾値（7日）以上前のメーターを未更新とみなす
export function isStaleMeter(meter: Meter, now: number = Date.now()): boolean {
  if (!meter.last_updated) {
    return true;
  }
  const lastUpdated = new Date(meter.last_updated).getTime();
  if (Number.isNaN(lastUpdated)) {
    return true;
  }
  return now - lastUpdated >= STALE_METER_THRESHOLD_MS;
}

export function partitionMeters(
  meters: Meter[],
  now: number = Date.now(),
): { activeMeters: Meter[]; staleMeters: Meter[] } {
  const activeMeters: Meter[] = [];
  const staleMeters: Meter[] = [];
  for (const meter of meters) {
    if (isStaleMeter(meter, now)) {
      staleMeters.push(meter);
    } else {
      activeMeters.push(meter);
    }
  }
  return { activeMeters, staleMeters };
}
