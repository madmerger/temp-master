import type { TimeScale } from '../types';

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function pad2(n: number): string {
  return n < 10 ? '0' + n : String(n);
}

export function formatTimestamp(timestamp: string, timeScale: TimeScale): string {
  const date = new Date(timestamp);
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  const dayShort = DAY_SHORT[date.getDay()];
  const monthShort = MONTH_SHORT[date.getMonth()];
  const dayNum = date.getDate();

  switch (timeScale) {
    case 'hour':
    case 'day':
      return `${hours}:${minutes}`;
    case 'week':
      return `${dayShort} ${hours}`;
    case 'month':
    case 'year':
      return `${monthShort} ${dayNum}`;
    default:
      return date.toLocaleString();
  }
}

export function formatLastUpdated(timestamp: string | null): string | null {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleString();
}

const STALE_METER_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

export function isStaleMeter(lastUpdated: string | null): boolean {
  if (!lastUpdated) return true;
  const date = new Date(lastUpdated);
  if (isNaN(date.getTime())) return true;
  return Date.now() - date.getTime() >= STALE_METER_THRESHOLD_MS;
}
