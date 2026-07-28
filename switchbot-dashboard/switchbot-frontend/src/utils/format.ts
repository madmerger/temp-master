import type { TimeScale } from '../types'

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

export function formatTimestamp(
  timestamp: string | number,
  timeScale: TimeScale,
): string {
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

export function formatClockTime(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
}

export function formatTemperature(value: number): string {
  return `${value.toFixed(1)}\u00b0C`
}
