import type { MeterDevice, TimeScale } from '../api/types';
import { STALE_METER_THRESHOLD_MS } from '../constants';

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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
];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** タイムスケールに応じてチャートの軸ラベルを整形する */
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

export function formatClockTime(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

/** 1週間以上更新がない、または値を受信していないメーターを未更新と判定する */
export function isStaleMeter(meter: MeterDevice): boolean {
  if (!meter.last_updated) {
    return true;
  }
  const lastUpdated = new Date(meter.last_updated);
  if (Number.isNaN(lastUpdated.getTime())) {
    return true;
  }
  return Date.now() - lastUpdated.getTime() >= STALE_METER_THRESHOLD_MS;
}
