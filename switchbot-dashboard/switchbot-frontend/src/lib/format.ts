import type { TimeScale } from '../types';

export const pad2 = (n: number): string => (n < 10 ? `0${n}` : `${n}`);

export const formatTimestamp = (timestamp: string, timeScale: TimeScale): string => {
  const date = new Date(timestamp);
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  const dayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
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
};

export const formatClock = (date: Date): string =>
  `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
