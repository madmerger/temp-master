import type { Meter } from '../api/types';

export const STALE_METER_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

export function isStaleMeter(meter: Meter): boolean {
  if (!meter.last_updated) return true;
  const timestamp = new Date(meter.last_updated).getTime();
  return Number.isNaN(timestamp) || Date.now() - timestamp >= STALE_METER_THRESHOLD_MS;
}
