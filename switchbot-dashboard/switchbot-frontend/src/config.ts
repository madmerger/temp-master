export const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
export const REFRESH_INTERVAL = 30000
export const STALE_METER_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000
export const DEFAULT_TIME_SCALE = 'day'
