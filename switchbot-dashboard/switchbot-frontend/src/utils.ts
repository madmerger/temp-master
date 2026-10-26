import { STALE_METER_THRESHOLD_MS } from './config'
import type { Meter, TimeScale } from './types'

export function pad2(value: number): string {
  return value < 10 ? `0${value}` : `${value}`
}

export function formatTimestamp(timestamp: string, timeScale?: TimeScale | string): string {
  const date = new Date(timestamp)
  const hours = pad2(date.getHours())
  const minutes = pad2(date.getMinutes())
  const dayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]
  const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()]
  const dayNum = date.getDate()

  switch (timeScale) {
    case 'hour':
    case 'day':
      return `${hours}:${minutes}`
    case 'week':
      return `${dayShort} ${hours}`
    case 'month':
    case 'year':
      return `${monthShort} ${dayNum}`
    default:
      return date.toLocaleString()
  }
}

export function isStaleMeter(meter: Meter | null, now = Date.now()): boolean {
  if (!meter?.last_updated) {
    return true
  }

  const lastUpdated = new Date(meter.last_updated).getTime()
  return Number.isNaN(lastUpdated) || now - lastUpdated >= STALE_METER_THRESHOLD_MS
}

export function extractFilename(disposition: string): string {
  const match = disposition.match(/filename="?([^";]+)"?/)
  return match ? match[1] : 'switchbot_backup.db'
}
