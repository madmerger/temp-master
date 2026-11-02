export const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
export const REFRESH_INTERVAL_MS = 30_000;
export const STALE_METER_THRESHOLD_MS =
  Number(import.meta.env.VITE_STALE_METER_THRESHOLD_MS) || 7 * 24 * 60 * 60 * 1000;
