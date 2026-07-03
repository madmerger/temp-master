import type { MetersResponse, HistoryResponse, StatusResponse, TimeScale } from './types'

const API_URL =
  window.location.protocol === 'file:' ? 'https://temp-master.fly.dev' : ''

export async function fetchMeters(): Promise<MetersResponse> {
  const res = await fetch(`${API_URL}/api/meters`)
  if (!res.ok) throw new Error(`Failed to fetch meters: ${res.status}`)
  return res.json() as Promise<MetersResponse>
}

export async function fetchHistory(
  deviceId: string,
  timeScale: TimeScale,
): Promise<HistoryResponse> {
  const params = new URLSearchParams({ time_scale: timeScale })
  const res = await fetch(
    `${API_URL}/api/meters/${encodeURIComponent(deviceId)}/history?${params}`,
  )
  if (!res.ok) throw new Error(`Failed to fetch history: ${res.status}`)
  return res.json() as Promise<HistoryResponse>
}

export async function fetchStatus(): Promise<StatusResponse> {
  const res = await fetch(`${API_URL}/api/status`)
  if (!res.ok) throw new Error(`Failed to fetch status: ${res.status}`)
  return res.json() as Promise<StatusResponse>
}

export async function triggerRefresh(): Promise<void> {
  const res = await fetch(`${API_URL}/api/meters/refresh`, { method: 'POST' })
  if (!res.ok) throw new Error(`Failed to refresh: ${res.status}`)
}

export function getBackupUrl(): string {
  return `${API_URL}/api/backup`
}
