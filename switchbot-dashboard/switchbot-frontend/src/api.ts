import { API_URL } from './config'
import type {
  HistoryResponse,
  MetersResponse,
  Status,
  TimeScale,
} from './types'

export class ApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function requestJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new ApiError(`HTTP ${response.status}`, response.status)
  }
  return (await response.json()) as T
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function fetchMeters(signal?: AbortSignal): Promise<MetersResponse> {
  return requestJson<MetersResponse>(`${API_URL}/api/meters`, signal)
}

export function fetchStatus(signal?: AbortSignal): Promise<Status> {
  return requestJson<Status>(`${API_URL}/api/status`, signal)
}

export function fetchHistory(
  deviceId: string,
  timeScale: TimeScale,
  signal?: AbortSignal,
): Promise<HistoryResponse> {
  return requestJson<HistoryResponse>(
    `${API_URL}/api/meters/${encodeURIComponent(deviceId)}/history?time_scale=${timeScale}`,
    signal,
  )
}

export async function triggerRefresh(signal?: AbortSignal): Promise<void> {
  const response = await fetch(`${API_URL}/api/meters/refresh`, {
    method: 'POST',
    signal,
  })
  if (!response.ok) {
    throw new ApiError(`HTTP ${response.status}`, response.status)
  }
}

export async function fetchDashboard(
  signal?: AbortSignal,
): Promise<{ meters: MetersResponse; status: Status }> {
  const metersRequest = fetchMeters(signal).catch((error: unknown) => {
    throw new Error(`Failed to fetch meters: ${errorMessage(error)}`)
  })
  const statusRequest = fetchStatus(signal).catch((error: unknown) => {
    throw new Error(`Failed to fetch status: ${errorMessage(error)}`)
  })
  const [meters, status] = await Promise.all([metersRequest, statusRequest])
  return { meters, status }
}

export async function downloadBackup(): Promise<void> {
  let response: Response
  try {
    response = await fetch('/api/backup')
  } catch (error) {
    throw new Error(`Failed to download backup: ${String(error)}`, {
      cause: error,
    })
  }

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as
      | { request_id?: string }
      | null
    const requestId = data?.request_id
    throw new Error(
      `Failed to download backup (HTTP ${response.status}).${requestId ? ` Request ID: ${requestId}` : ''}`,
    )
  }

  const disposition = response.headers.get('Content-Disposition') || ''
  const match = disposition.match(/filename="?([^";]+)"?/)
  const filename = match ? match[1] : 'switchbot_backup.db'
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
