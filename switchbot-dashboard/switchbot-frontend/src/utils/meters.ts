import type { Meter } from '../api'

export const STALE_METER_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000

export function isStaleMeter(meter: Meter, now: number = Date.now()): boolean {
  if (!meter.last_updated) return true
  const lastUpdated = new Date(meter.last_updated).getTime()
  if (Number.isNaN(lastUpdated)) return true
  return now - lastUpdated >= STALE_METER_THRESHOLD_MS
}

export function splitMeters(meters: Meter[]): { active: Meter[]; stale: Meter[] } {
  const now = Date.now()
  const active: Meter[] = []
  const stale: Meter[] = []
  for (const meter of meters) {
    ;(isStaleMeter(meter, now) ? stale : active).push(meter)
  }
  return { active, stale }
}
