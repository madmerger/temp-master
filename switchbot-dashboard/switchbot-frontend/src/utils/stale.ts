import { STALE_METER_THRESHOLD_MS } from '../config'
import type { Meter } from '../types'

export function isStaleMeter(
  meter: Pick<Meter, 'last_updated'>,
  now = Date.now(),
): boolean {
  if (!meter.last_updated) {
    return true
  }

  const updatedAt = new Date(meter.last_updated).getTime()
  if (Number.isNaN(updatedAt)) {
    return true
  }

  return now - updatedAt >= STALE_METER_THRESHOLD_MS
}
