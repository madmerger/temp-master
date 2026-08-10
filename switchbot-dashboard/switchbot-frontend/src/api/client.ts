import type { MeterHistoryResponse, MetersResponse, StatusResponse, TimeScale } from './types'

export const API_URL = import.meta.env.VITE_API_URL || 'https://snakeroom.fly.dev'

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${url}`, init)
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

export function getMeters(): Promise<MetersResponse> {
  return fetchJson<MetersResponse>('/api/meters')
}

export function getStatus(): Promise<StatusResponse> {
  return fetchJson<StatusResponse>('/api/status')
}

export function getHistory(
  deviceId: string,
  timeScale: TimeScale,
): Promise<MeterHistoryResponse> {
  return fetchJson<MeterHistoryResponse>(
    `/api/meters/${encodeURIComponent(deviceId)}/history?time_scale=${timeScale}`,
  )
}

export function refreshMeters(): Promise<unknown> {
  return fetchJson('/api/meters/refresh', { method: 'POST' })
}
