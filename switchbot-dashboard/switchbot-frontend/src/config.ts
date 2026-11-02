const staleThresholdValue = import.meta.env.VITE_STALE_METER_THRESHOLD_MS
const staleThreshold = staleThresholdValue?.trim()
  ? Number(staleThresholdValue)
  : Number.NaN

export const API_URL = (
  import.meta.env.VITE_API_URL ??
  (import.meta.env.DEV ? '' : 'https://snakeroom.fly.dev')
).replace(/\/+$/, '')
export const REFRESH_INTERVAL_MS = 30_000
export const STALE_METER_THRESHOLD_MS =
  Number.isNaN(staleThreshold)
    ? 7 * 24 * 60 * 60 * 1000
    : staleThreshold
export const THEME_STORAGE_KEY = 'temp-master-theme'
