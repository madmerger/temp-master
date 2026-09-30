import { STALE_METER_THRESHOLD_MS } from '../config'
import type { Meter } from '../types'

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

export function splitMeters(meters: Meter[], now = Date.now()): { activeMeters: Meter[]; staleMeters: Meter[] } {
  const activeMeters: Meter[] = []
  const staleMeters: Meter[] = []

  meters.forEach((meter) => {
    if (isStaleMeter(meter, now)) {
      staleMeters.push(meter)
    } else {
      activeMeters.push(meter)
    }
  })

  return { activeMeters, staleMeters }
}
