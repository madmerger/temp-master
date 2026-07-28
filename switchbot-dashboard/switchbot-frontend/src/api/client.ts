import type {
  HistoryResponse,
  MetersResponse,
  StatusResponse,
  TimeScale,
} from '../types'

// Data is served by the snakeroom backend, which actively collects readings
// from the same SwitchBot devices. Point all API calls there by default.
export const API_URL = (
  import.meta.env.VITE_API_URL ?? 'https://snakeroom.fly.dev'
).replace(/\/$/, '')

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`)
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }
  return (await response.json()) as T
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
  const query = new URLSearchParams({ time_scale: timeScale })
  return getJson<HistoryResponse>(
    `/api/meters/${encodeURIComponent(deviceId)}/history?${query.toString()}`,
  )
}

export async function triggerRefresh(): Promise<void> {
  const response = await fetch(`${API_URL}/api/meters/refresh`, {
    method: 'POST',
  })
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }
}

export function backupUrl(): string {
  return `${API_URL}/api/backup`
}
