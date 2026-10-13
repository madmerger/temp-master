import type { Meter } from '../types'

export const STALE_METER_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000

export function isStaleMeter(meter: Meter, now = Date.now()): boolean {
  if (!meter.last_updated) {
    return true
  }

  const lastUpdated = new Date(meter.last_updated)
  if (Number.isNaN(lastUpdated.getTime())) {
    return true
  }

  return now - lastUpdated.getTime() >= STALE_METER_THRESHOLD_MS
}

export function partitionMeters(
  meters: Meter[],
  now?: number,
): { active: Meter[]; stale: Meter[] } {
  const active: Meter[] = []
  const stale: Meter[] = []

  for (const meter of meters) {
    if (isStaleMeter(meter, now)) {
      stale.push(meter)
    } else {
      active.push(meter)
    }
  }

  return { active, stale }
}
