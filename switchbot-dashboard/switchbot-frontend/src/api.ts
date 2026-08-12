import type { HistoryResponse, MetersResponse, StatusResponse, TimeScale } from './types'

export const API_URL = (import.meta.env.VITE_API_URL || 'https://snakeroom.fly.dev').replace(/\/$/, '')

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, options)
  if (!response.ok) {
    let detail = response.statusText
    try {
      const body = (await response.json()) as { detail?: string }
      detail = body.detail || detail
    } catch {
      // Keep the HTTP status text when the response is not JSON.
    }
    throw new Error(`${response.status} ${detail}`)
  }
  return (await response.json()) as T
}

export const fetchMeters = (): Promise<MetersResponse> => request('/api/meters')
export const fetchStatus = (): Promise<StatusResponse> => request('/api/status')
export const fetchHistory = (deviceId: string, timeScale: TimeScale): Promise<HistoryResponse> =>
  request(`/api/meters/${encodeURIComponent(deviceId)}/history?time_scale=${timeScale}`)
export const triggerRefresh = (): Promise<{ status: string; message: string; meters_count: number }> =>
  request('/api/meters/refresh', { method: 'POST' })
