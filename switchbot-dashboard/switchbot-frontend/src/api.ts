import type { HistoryResponse, MetersResponse, StatusResponse, TimeScale } from './types'

// When served from the FastAPI backend (same origin) API_URL stays empty.
// When opened directly as a file:// URL, fall back to the production backend.
// VITE_API_URL can override this explicitly if set at build time.
const ENV_API_URL = import.meta.env.VITE_API_URL as string | undefined

export const API_URL =
  ENV_API_URL && ENV_API_URL.length > 0
    ? ENV_API_URL
    : window.location.protocol === 'file:'
      ? 'https://temp-master.fly.dev'
      : ''

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(API_URL + path)
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  return (await res.json()) as T
}

export function fetchMeters(): Promise<MetersResponse> {
  return getJson<MetersResponse>('/api/meters')
}

export function fetchStatus(): Promise<StatusResponse> {
  return getJson<StatusResponse>('/api/status')
}

export function fetchHistory(deviceId: string, timeScale: TimeScale): Promise<HistoryResponse> {
  const qs = new URLSearchParams({ time_scale: timeScale }).toString()
  return getJson<HistoryResponse>(
    `/api/meters/${encodeURIComponent(deviceId)}/history?${qs}`,
  )
}

export async function triggerRefresh(): Promise<void> {
  const res = await fetch(API_URL + '/api/meters/refresh', { method: 'POST' })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
}

export function backupUrl(): string {
  return API_URL + '/api/backup'
}
