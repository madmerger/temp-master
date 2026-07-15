import {
  DISPLAY_NAMES,
  STALE_METER_THRESHOLD_MS,
} from "../constants";
import type { MeterDevice, TimeScale } from "../types/api";

const TIME_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
});
const WEEK_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  weekday: "short",
  hour: "2-digit",
});
const DATE_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  month: "short",
  day: "numeric",
});
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function getDisplayName(deviceName: string): string {
  return DISPLAY_NAMES[deviceName] ?? deviceName;
}

export function isStaleMeter(meter: MeterDevice): boolean {
  if (!meter.last_updated) {
    return true;
  }

  const lastUpdated = new Date(meter.last_updated).getTime();
  return (
    Number.isNaN(lastUpdated) ||
    Date.now() - lastUpdated >= STALE_METER_THRESHOLD_MS
  );
}

export function formatTimestamp(
  timestamp: string,
  timeScale: TimeScale,
): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  if (timeScale === "hour" || timeScale === "day") {
    return TIME_FORMATTER.format(date);
  }

  if (timeScale === "week") {
    return WEEK_FORMATTER.format(date);
  }

  return DATE_FORMATTER.format(date);
}

export function formatDateTime(timestamp: string | null): string {
  if (!timestamp) {
    return "データ未受信";
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "日時不明";
  }

  return DATE_TIME_FORMATTER.format(date);
}
