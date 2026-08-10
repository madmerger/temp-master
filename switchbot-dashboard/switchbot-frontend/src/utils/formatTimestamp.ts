import type { TimeScale } from '../api/types'

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

export function formatTimestamp(timestamp: string, timeScale: TimeScale): string {
  const date = new Date(timestamp)
  const hours = pad2(date.getHours())
  const minutes = pad2(date.getMinutes())
  const dayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]
  const monthShort = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ][date.getMonth()]
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
