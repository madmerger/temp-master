import { API_URL } from '../config'
import type { DashboardStatus, MeterHistoryResponse, MetersResponse, TimeScale } from '../types'

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''}`)
  }
  return response.json() as Promise<T>
}

export function fetchMeters(): Promise<MetersResponse> {
  return fetchJson<MetersResponse>('/api/meters')
}

export function fetchStatus(): Promise<DashboardStatus> {
  return fetchJson<DashboardStatus>('/api/status')
}

export function fetchHistory(deviceId: string, timeScale: TimeScale, signal: AbortSignal): Promise<MeterHistoryResponse> {
  const id = encodeURIComponent(deviceId)
  return fetchJson<MeterHistoryResponse>(`/api/meters/${id}/history?time_scale=${timeScale}`, { signal })
}

export function triggerRefresh(): Promise<unknown> {
  return fetchJson<unknown>('/api/meters/refresh', { method: 'POST' })
}

export const backupUrl = `${API_URL}/api/backup`
