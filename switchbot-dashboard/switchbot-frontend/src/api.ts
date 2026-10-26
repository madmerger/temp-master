import { API_URL } from './config'
import type { HistoryResponse, MetersResponse, StatusResponse, TimeScale } from './types'

async function request(url: string, init?: RequestInit): Promise<Response> {
  let response: Response
  try {
    response = await fetch(url, init)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    throw new Error('error')
  }

  if (!response.ok) {
    throw new Error(response.statusText || 'error')
  }
  return response
}

export async function fetchMeters(): Promise<MetersResponse> {
  const response = await request(`${API_URL}/api/meters`)
  return response.json() as Promise<MetersResponse>
}

export async function fetchStatus(): Promise<StatusResponse> {
  const response = await request(`${API_URL}/api/status`)
  return response.json() as Promise<StatusResponse>
}

export async function fetchHistory(
  deviceId: string,
  scale: TimeScale,
  signal?: AbortSignal,
): Promise<HistoryResponse> {
  const response = await request(
    `${API_URL}/api/meters/${encodeURIComponent(deviceId)}/history?time_scale=${encodeURIComponent(scale)}`,
    { signal },
  )
  return response.json() as Promise<HistoryResponse>
}

export async function triggerRefresh(): Promise<void> {
  await request(`${API_URL}/api/meters/refresh`, { method: 'POST' })
}

export async function downloadBackup(): Promise<Response> {
  return fetch('/api/backup')
}
