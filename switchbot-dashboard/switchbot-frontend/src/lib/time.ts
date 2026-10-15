import type { Meter, TimeScale } from '../types';

export const STALE_METER_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

function pad2(value: number): string {
  return value < 10 ? `0${value}` : `${value}`;
}

export function formatTimestamp(timestamp: string, timeScale: TimeScale): string {
  const date = new Date(timestamp);
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  const dayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][
    date.getMonth()
  ];
  const dayNum = date.getDate();

  switch (timeScale) {
    case 'hour':
      return `${hours}:${minutes}`;
    case 'week':
      return `${dayShort} ${hours}`;
    case 'month':
    case 'year':
      return `${monthShort} ${dayNum}`;
    case 'day':
      return `${hours}:${minutes}`;
    default:
      return date.toLocaleString();
  }
}

export function isStaleMeter(meter: Pick<Meter, 'last_updated'>, now = Date.now()): boolean {
  if (!meter.last_updated) return true;

  const lastUpdated = new Date(meter.last_updated).getTime();
  if (Number.isNaN(lastUpdated)) return true;

  return now - lastUpdated >= STALE_METER_THRESHOLD_MS;
}
