import type { Meter, TimeScale } from '../types'
import { STALE_METER_THRESHOLD_MS } from '../constants'

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function pad2(n: number): string {
  return n < 10 ? '0' + n : '' + n
}

export function formatTimestamp(timestamp: string, timeScale: TimeScale): string {
  const date = new Date(timestamp)
  const hours = pad2(date.getHours())
  const minutes = pad2(date.getMinutes())
  const dayShort = DAY_SHORT[date.getDay()]
  const monthShort = MONTH_SHORT[date.getMonth()]
  const dayNum = date.getDate()

  switch (timeScale) {
    case 'hour':
      return `${hours}:${minutes}`
    case 'day':
      return `${hours}:${minutes}`
    case 'week':
      return `${dayShort} ${hours}`
    case 'month':
      return `${monthShort} ${dayNum}`
    case 'year':
      return `${monthShort} ${dayNum}`
    default:
      return date.toLocaleString()
  }
}

export function isStaleMeter(meter: Meter): boolean {
  if (!meter.last_updated) {
    return true
  }
  const lastUpdated = new Date(meter.last_updated)
  if (isNaN(lastUpdated.getTime())) {
    return true
  }
  return Date.now() - lastUpdated.getTime() >= STALE_METER_THRESHOLD_MS
}

export function formatClock(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
}
