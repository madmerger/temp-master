import type { MeterHistoryResponse, MetersResponse, StatusResponse, TimeScale } from './types'

const envUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim()

export const API_URL = (() => {
  // When VITE_API_URL is not defined, fall back to the production backend.
  if (envUrl === undefined) {
    return 'https://snakeroom.fly.dev'
  }
  // Empty string or '/' means use the same origin (e.g. when served by FastAPI in Docker).
  if (envUrl === '' || envUrl === '/') {
    return ''
  }
  return envUrl.replace(/\/+$/, '')
})()

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
