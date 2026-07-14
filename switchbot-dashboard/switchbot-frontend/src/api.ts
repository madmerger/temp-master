import type {
  HistoryResponse,
  MetersResponse,
  Status,
  TimeScale,
} from './types'

// Base URL for the backend. Defaults to same-origin so the app works both
// behind the Vite dev proxy and when served by FastAPI from /static.
// Override with VITE_API_URL (e.g. https://snakeroom.fly.dev).
const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`)
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`)
  }
  return (await res.json()) as T
}

export function fetchMeters(): Promise<MetersResponse> {
  return getJson<MetersResponse>('/api/meters')
}

export function fetchStatus(): Promise<Status> {
  return getJson<Status>('/api/status')
}

export function fetchHistory(
  deviceId: string,
  timeScale: TimeScale,
): Promise<HistoryResponse> {
  const params = new URLSearchParams({ time_scale: timeScale })
  return getJson<HistoryResponse>(
    `/api/meters/${encodeURIComponent(deviceId)}/history?${params.toString()}`,
  )
}

export async function triggerRefresh(): Promise<void> {
  const res = await fetch(`${API_URL}/api/meters/refresh`, { method: 'POST' })
  if (!res.ok) {
    throw new Error(`Refresh failed: ${res.status} ${res.statusText}`)
  }
}

export function backupUrl(): string {
  return `${API_URL}/api/backup`
}
