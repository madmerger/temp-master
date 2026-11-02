import { STALE_METER_THRESHOLD_MS } from '../config';
import type { Meter, TimeScale } from '../types';

export function pad2(value: number): string {
  return value < 10 ? `0${value}` : `${value}`;
}

export function formatTimestamp(timestamp: string, scale: TimeScale | string): string {
  const date = new Date(timestamp);
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  const dayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  const monthShort = [
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
  ][date.getMonth()];

  switch (scale) {
    case 'hour':
    case 'day':
      return `${hours}:${minutes}`;
    case 'week':
      return `${dayShort} ${hours}`;
    case 'month':
    case 'year':
      return `${monthShort} ${date.getDate()}`;
    default:
      return date.toLocaleString();
  }
}

export function isStaleMeter(meter: Meter, now = Date.now()): boolean {
  if (!meter.last_updated) {
    return true;
  }
  const updatedAt = new Date(meter.last_updated).getTime();
  return !Number.isFinite(updatedAt) || now - updatedAt >= STALE_METER_THRESHOLD_MS;
}
