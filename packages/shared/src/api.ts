import type { HistoryEntry, Meter, Status, TimeScale } from './meters.ts'

export const DEFAULT_API_URL = 'https://snakeroom.fly.dev'

interface MetersResponse {
  meters: Meter[]
  last_updated: string | null
}

interface HistoryResponse {
  device_id: string
  time_scale: TimeScale
  history: HistoryEntry[]
  device: Meter | null
}

interface RefreshResponse {
  status: string
  message: string
  meters_count: number
}

async function request(url: string, options?: RequestInit): Promise<Response> {
  const response = await fetch(url, options)
  if (response.ok) return response

  let requestId = response.headers.get('X-Request-ID')
  if (!requestId) {
    const body = await response.json().catch(() => null)
    if (typeof body?.request_id === 'string') requestId = body.request_id
  }
  throw new Error(`HTTP ${response.status}${requestId ? `. Request ID: ${requestId}` : ''}`)
}

async function getJson<T>(url: string, options?: RequestInit): Promise<T> {
  return (await request(url, options)).json()
}

const DEFAULT_BACKUP_FILENAME = 'switchbot_backup.db'

function backupFilename(disposition: string): string {
  const encoded = disposition.match(/;\s*filename\*=UTF-8'[^']*'([^;]+)/i)?.[1]
  if (encoded) {
    try {
      return decodeURIComponent(encoded.trim())
    } catch {
      // Fall back to the plain filename when the encoded parameter is malformed.
    }
  }
  const plain = disposition.match(/;\s*filename\s*=\s*(?:"([^"]+)"|([^;]+))/i)
  return plain?.[1] || plain?.[2]?.trim() || DEFAULT_BACKUP_FILENAME
}

export function createApiClient(baseUrl = DEFAULT_API_URL, backupBaseUrl = baseUrl) {
  const api = baseUrl.replace(/\/+$/, '')
  const backup = backupBaseUrl.replace(/\/+$/, '')

  return {
    getMeters(signal?: AbortSignal) {
      return getJson<MetersResponse>(`${api}/api/meters`, { signal })
    },
    getHistory(deviceId: string, timeScale: TimeScale, signal?: AbortSignal) {
      const id = encodeURIComponent(deviceId)
      return getJson<HistoryResponse>(`${api}/api/meters/${id}/history?time_scale=${timeScale}`, { signal })
    },
    refreshMeters() {
      return getJson<RefreshResponse>(`${api}/api/meters/refresh`, { method: 'POST' })
    },
    getStatus(signal?: AbortSignal) {
      return getJson<Status>(`${api}/api/status`, { signal })
    },
    async getBackup(signal?: AbortSignal) {
      const response = await request(`${backup}/api/backup`, { signal })
      const blob = await response.blob()
      if (await blob.slice(0, 16).text() !== 'SQLite format 3\0') {
        throw new Error('The server did not return a SQLite backup')
      }
      return {
        blob,
        filename: backupFilename(response.headers.get('Content-Disposition') ?? ''),
      }
    },
  }
}
