import type { TimeScale } from "../api/client";

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatTimestamp(timestamp: string, timeScale: TimeScale): string {
  const date = new Date(timestamp);
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  const dayShort = DAY_SHORT[date.getDay()];
  const monthShort = MONTH_SHORT[date.getMonth()];
  const dayNum = date.getDate();

  switch (timeScale) {
    case "hour":
    case "day":
      return `${hours}:${minutes}`;
    case "week":
      return `${dayShort} ${hours}`;
    case "month":
    case "year":
      return `${monthShort} ${dayNum}`;
    default:
      return date.toLocaleString();
  }
}

export function formatClock(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

export function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}秒前`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}分前`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}時間前`;
  return date.toLocaleString();
}
