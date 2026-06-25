import type { TimeScale } from '../types';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function formatTimestamp(timestamp: string, timeScale: TimeScale): string {
  const date = new Date(timestamp);
  const hh = pad2(date.getHours());
  const mm = pad2(date.getMinutes());
  const day = DAY_NAMES[date.getDay()]!;
  const month = MONTH_NAMES[date.getMonth()]!;
  const dayNum = date.getDate();

  switch (timeScale) {
    case 'hour':
    case 'day':
      return `${hh}:${mm}`;
    case 'week':
      return `${day} ${hh}`;
    case 'month':
    case 'year':
      return `${month} ${dayNum}`;
  }
}
