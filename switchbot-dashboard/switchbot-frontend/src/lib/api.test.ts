import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchHistory, parseContentDispositionFilename } from './api'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('parseContentDispositionFilename', () => {
  it.each([
    ['attachment; filename="backup.db"', 'backup.db'],
    ['attachment; filename=backup.db', 'backup.db'],
    ['attachment; filename="switchbot_backup_20261013_010203.db"', 'switchbot_backup_20261013_010203.db'],
    [null, 'switchbot_backup.db'],
  ])('parses %s', (header, filename) => {
    expect(parseContentDispositionFilename(header)).toBe(filename)
  })
})

describe('fetchHistory', () => {
  it('encodes the device id and includes the time scale query', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ device_id: 'abc/1', time_scale: 'week', history: [], device: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await fetchHistory('abc/1', 'week')

    expect(fetchMock).toHaveBeenCalledWith('/api/meters/abc%2F1/history?time_scale=week', undefined)
  })

  it('throws an ApiError with the status and request ID', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ request_id: 'req-123', detail: 'Unavailable' }), {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    await expect(fetchHistory('meter-1', 'week')).rejects.toMatchObject({
      name: 'ApiError',
      status: 503,
      requestId: 'req-123',
      message: 'HTTP 503 Service Unavailable',
    })
  })
})
