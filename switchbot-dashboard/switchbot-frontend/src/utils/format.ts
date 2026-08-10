import type { TimeScale } from '../api/types';

export function formatTimestamp(timestamp: string, timeScale: TimeScale): string {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
  if (timeScale === 'hour' || timeScale === 'day') return `${hours}:${minutes}`;
  if (timeScale === 'week') return `${day} ${hours}`;
  if (timeScale === 'month' || timeScale === 'year') return `${month} ${date.getDate()}`;
  return date.toLocaleString();
}
