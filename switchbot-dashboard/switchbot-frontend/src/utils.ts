import type { MeterDevice, TimeScale } from './types'

// A meter is considered stale when it has not reported for at least a week.
export const STALE_METER_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000

function pad2(n: number): string {
  return n < 10 ? '0' + n : '' + n
}

// Ported from the legacy index.html isStaleMeter().
export function isStaleMeter(meter: MeterDevice): boolean {
  if (!meter.last_updated) return true
  const lastUpdated = new Date(meter.last_updated)
  if (Number.isNaN(lastUpdated.getTime())) return true
  return Date.now() - lastUpdated.getTime() >= STALE_METER_THRESHOLD_MS
}

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

// Ported from the legacy index.html formatTimestamp().
export function formatTimestamp(timestamp: string, timeScale: TimeScale): string {
  const date = new Date(timestamp)
  const hours = pad2(date.getHours())
  const minutes = pad2(date.getMinutes())
  const dayShort = DAY_SHORT[date.getDay()]
  const monthShort = MONTH_SHORT[date.getMonth()]
  const dayNum = date.getDate()

  switch (timeScale) {
    case 'hour':
      return hours + ':' + minutes
    case 'day':
      return hours + ':' + minutes
    case 'week':
      return dayShort + ' ' + hours
    case 'month':
      return monthShort + ' ' + dayNum
    case 'year':
      return monthShort + ' ' + dayNum
    default:
      return date.toLocaleString()
  }
}

export function formatClock(now: Date): string {
  return pad2(now.getHours()) + ':' + pad2(now.getMinutes()) + ':' + pad2(now.getSeconds())
}
