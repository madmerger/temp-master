import { API_URL } from '../config'
import type {
  HistoryResponse,
  MetersResponse,
  Status,
  TimeScale,
} from '../types'

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`)
  }
  return response.json() as Promise<T>
}

export function fetchMeters(): Promise<MetersResponse> {
  return request(`${API_URL}/api/meters`)
}

export function fetchStatus(): Promise<Status> {
  return request(`${API_URL}/api/status`)
}

export function fetchHistory(
  deviceId: string,
  timeScale: TimeScale,
): Promise<HistoryResponse> {
  return request(
    `${API_URL}/api/meters/${encodeURIComponent(deviceId)}/history?time_scale=${encodeURIComponent(timeScale)}`,
  )
}

export function triggerRefresh(): Promise<unknown> {
  return request(`${API_URL}/api/meters/refresh`, { method: 'POST' })
}

export function getBackupUrl(): string {
  return `${API_URL}/api/backup`
}
