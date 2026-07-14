import type {
  HistoryResponse,
  MetersResponse,
  StatusResponse,
  TimeScale,
} from '../types'

export const API_URL =
  import.meta.env.VITE_API_URL ?? 'https://snakeroom.fly.dev'

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`)
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`)
  }
  return (await res.json()) as T
}

export function fetchMeters(): Promise<MetersResponse> {
  return getJson<MetersResponse>('/api/meters')
}

export function fetchStatus(): Promise<StatusResponse> {
  return getJson<StatusResponse>('/api/status')
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
    throw new Error(`Refresh failed (${res.status})`)
  }
}

export function backupUrl(): string {
  return `${API_URL}/api/backup`
}
