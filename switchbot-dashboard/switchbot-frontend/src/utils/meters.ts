import { STALE_METER_THRESHOLD_MS } from '../constants'
import type { MeterDevice } from '../types'

export function isStaleMeter(meter: MeterDevice): boolean {
  if (!meter.last_updated) {
    return true
  }

  const lastUpdated = new Date(meter.last_updated)
  if (Number.isNaN(lastUpdated.getTime())) {
    return true
  }

  return Date.now() - lastUpdated.getTime() >= STALE_METER_THRESHOLD_MS
}

export function splitMetersByStaleness(meters: MeterDevice[]): {
  activeMeters: MeterDevice[]
  staleMeters: MeterDevice[]
} {
  const activeMeters: MeterDevice[] = []
  const staleMeters: MeterDevice[] = []

  for (const meter of meters) {
    if (isStaleMeter(meter)) {
      staleMeters.push(meter)
    } else {
      activeMeters.push(meter)
    }
  }

  return { activeMeters, staleMeters }
}
