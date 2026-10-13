import type { HistoryResponse, MetersResponse, StatusResponse, TimeScale } from '../types'

export const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

export class ApiError extends Error {
  status: number
  requestId?: string

  constructor(message: string, status: number, requestId?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.requestId = requestId
  }
}

interface ErrorPayload {
  request_id?: string
  detail?: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, init)
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error))
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ErrorPayload | null
    throw new ApiError(
      `HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''}`,
      response.status,
      payload?.request_id,
    )
  }

  return (await response.json()) as T
}

export function fetchMeters(): Promise<MetersResponse> {
  return request<MetersResponse>('/api/meters')
}

export function fetchStatus(): Promise<StatusResponse> {
  return request<StatusResponse>('/api/status')
}

export function fetchHistory(deviceId: string, timeScale: TimeScale): Promise<HistoryResponse> {
  return request<HistoryResponse>(
    `/api/meters/${encodeURIComponent(deviceId)}/history?time_scale=${encodeURIComponent(timeScale)}`,
  )
}

export function triggerRefresh(): Promise<unknown> {
  return request<unknown>('/api/meters/refresh', { method: 'POST' })
}

export function parseContentDispositionFilename(header: string | null): string {
  const match = header?.match(/filename="?([^";]+)"?/)
  return match ? match[1] : 'switchbot_backup.db'
}

export async function downloadBackup(): Promise<{ blob: Blob; filename: string }> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}/api/backup`)
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error))
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ErrorPayload | null
    throw new ApiError(
      `HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''}`,
      response.status,
      payload?.request_id,
    )
  }

  return {
    blob: await response.blob(),
    filename: parseContentDispositionFilename(response.headers.get('Content-Disposition')),
  }
}
