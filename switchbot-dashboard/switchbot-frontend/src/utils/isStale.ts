import type { MeterDevice } from '../api/types'

export const STALE_METER_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000

export function isStaleMeter(meter: Pick<MeterDevice, 'last_updated'>): boolean {
  if (!meter.last_updated) {
    return true
  }

  const lastUpdated = new Date(meter.last_updated)
  if (Number.isNaN(lastUpdated.getTime())) {
    return true
  }

  return Date.now() - lastUpdated.getTime() >= STALE_METER_THRESHOLD_MS
}
