import type { TimeScale } from "../types";

function pad2(n: number): string {
  return n < 10 ? "0" + String(n) : String(n);
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

export function formatTimestamp(timestamp: string, timeScale: TimeScale): string {
  const date = new Date(timestamp);
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  const dayShort = DAY_NAMES[date.getDay()];
  const monthShort = MONTH_NAMES[date.getMonth()];
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
