import { DISPLAY_NAMES, STALE_METER_THRESHOLD_MS } from "./constants";
import type { Meter, TimeScale } from "./types";

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const pad2 = (value: number) => String(value).padStart(2, "0");

export function getDisplayName(deviceName: string): string {
  return DISPLAY_NAMES[deviceName] ?? deviceName;
}

export function isStaleMeter(meter: Meter): boolean {
  if (!meter.last_updated) {
    return true;
  }

  const timestamp = new Date(meter.last_updated).getTime();
  return Number.isNaN(timestamp) || Date.now() - timestamp >= STALE_METER_THRESHOLD_MS;
}

export function formatTimestamp(timestamp: string, timeScale: TimeScale): string {
  const date = new Date(timestamp);
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());

  switch (timeScale) {
    case "hour":
    case "day":
      return `${hours}:${minutes}`;
    case "week":
      return `${DAY_SHORT[date.getDay()]} ${hours}`;
    case "month":
    case "year":
      return `${MONTH_SHORT[date.getMonth()]} ${date.getDate()}`;
  }
}

export function formatRefreshTime(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}
