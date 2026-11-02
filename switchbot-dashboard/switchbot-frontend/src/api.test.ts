import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  downloadBackup,
  fetchDashboard,
  fetchHistory,
  triggerRefresh,
} from './api'
import { API_URL } from './config'

function mockResponse(
  data: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    blob: async () => new Blob(),
    headers: {
      get: (name: string) =>
        headers[name] ?? headers[name.toLowerCase()] ?? null,
    },
  } as Response
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((complete) => {
    resolve = complete
  })
  return { promise, resolve }
}

describe('API client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('starts both dashboard requests before either resolves', async () => {
    const metersResponse = deferred<Response>()
    const statusResponse = deferred<Response>()
    const fetchMock = vi.mocked(fetch)
    fetchMock
      .mockReturnValueOnce(metersResponse.promise)
      .mockReturnValueOnce(statusResponse.promise)

    const dashboardPromise = fetchDashboard()

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenNthCalledWith(1, `${API_URL}/api/meters`, {
      signal: undefined,
    })
    expect(fetchMock).toHaveBeenNthCalledWith(2, `${API_URL}/api/status`, {
      signal: undefined,
    })

    metersResponse.resolve(mockResponse({ meters: [], last_updated: null }))
    statusResponse.resolve(
      mockResponse({
        configured: true,
        meters_count: 0,
        is_rate_limited: false,
        backoff_remaining: 0,
        last_api_call: null,
        collection_interval: 120,
      }),
    )
    await expect(dashboardPromise).resolves.toMatchObject({
      meters: { meters: [] },
      status: { meters_count: 0 },
    })
  })

  it('prefixes dashboard failures by endpoint', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(mockResponse({}, 500))
      .mockResolvedValueOnce(mockResponse({}, 200))
    await expect(fetchDashboard()).rejects.toThrow(
      'Failed to fetch meters: HTTP 500',
    )

    vi.mocked(fetch)
      .mockResolvedValueOnce(mockResponse({}, 200))
      .mockResolvedValueOnce(mockResponse({}, 503))
    await expect(fetchDashboard()).rejects.toThrow(
      'Failed to fetch status: HTTP 503',
    )
  })

  it('encodes history IDs and passes the selected time scale', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockResponse({ device_id: '', time_scale: 'week', history: [], device: null }),
    )

    await fetchHistory('device / one', 'week')

    expect(fetch).toHaveBeenCalledWith(
      `${API_URL}/api/meters/device%20%2F%20one/history?time_scale=week`,
      { signal: undefined },
    )
  })

  it('sends manual refreshes with POST', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse(null, 204))

    await triggerRefresh()

    expect(fetch).toHaveBeenCalledWith(`${API_URL}/api/meters/refresh`, {
      method: 'POST',
      signal: undefined,
    })
  })

  it('downloads backups from the same-origin endpoint and includes request IDs', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      mockResponse({ request_id: 'req-42' }, 500),
    )

    await expect(downloadBackup()).rejects.toThrow(
      'Failed to download backup (HTTP 500). Request ID: req-42',
    )
    expect(fetch).toHaveBeenCalledWith('/api/backup')
  })
})
