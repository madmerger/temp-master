import { STALE_METER_THRESHOLD_MS } from '../config';
import type { Meter } from '../types';

export const isStaleMeter = (meter: Meter, now: number = Date.now()): boolean => {
  if (!meter.last_updated) {
    return true;
  }

  const timestamp = new Date(meter.last_updated).getTime();
  return Number.isNaN(timestamp) || now - timestamp >= STALE_METER_THRESHOLD_MS;
};
