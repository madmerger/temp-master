import assert from 'node:assert/strict'
import test from 'node:test'
import { createApiClient, formatTimestamp, getDisplayName, isStaleMeter } from '../src/index.ts'

const backupBytes = 'SQLite format 3\0test backup'

test('keeps aliases and detects stale meters at exactly seven days', () => {
  const now = Date.parse('2026-11-25T00:00:00Z')
  assert.equal(getDisplayName('Bedroom Meter'), '第1蒸留塔 (T-101)')
  assert.equal(getDisplayName('ガー子ケージ'), '配管ライン (PL-1002)')
  assert.equal(getDisplayName('__proto__'), '__proto__')
  assert.equal(isStaleMeter({ last_updated: '2026-11-18T00:00:00Z' }, now), true)
  assert.equal(isStaleMeter({ last_updated: '2026-11-18T00:00:00.001Z' }, now), false)
  assert.equal(isStaleMeter({ last_updated: null }, now), true)
  assert.equal(isStaleMeter({ last_updated: 'unknown' }, now), true)

  const local = new Date(2026, 10, 25, 7, 8).toISOString()
  assert.equal(formatTimestamp(local, 'day'), '07:08')
  assert.equal(formatTimestamp(local, 'week'), 'Wed 07')
  assert.equal(formatTimestamp(local, 'year'), 'Nov 25')
})

test('uses the existing routes and permits same-origin backup alongside remote readings', async (t) => {
  const calls = []
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push([url, options?.method ?? 'GET'])
    if (url === '/api/backup') {
      return new Response(backupBytes, {
        headers: { 'Content-Disposition': 'attachment; filename="switchbot_backup_20261125.db"' },
      })
    }
    return Response.json({})
  })
  const api = createApiClient('https://example.invalid/', '')
  await api.getMeters()
  await api.getHistory('floor 1#', 'week')
  await api.refreshMeters()
  await api.getStatus()
  const { blob, filename } = await api.getBackup()
  assert.equal(await blob.text(), backupBytes)
  assert.equal(filename, 'switchbot_backup_20261125.db')
  assert.deepEqual(calls, [
    ['https://example.invalid/api/meters', 'GET'],
    ['https://example.invalid/api/meters/floor%201%23/history?time_scale=week', 'GET'],
    ['https://example.invalid/api/meters/refresh', 'POST'],
    ['https://example.invalid/api/status', 'GET'],
    ['/api/backup', 'GET'],
  ])
})

test('decodes UTF-8 backup filenames and falls back to a standard name', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(backupBytes, {
    headers: { 'Content-Disposition': 'attachment; filename="fallback.db"; filename*=UTF-8\'\'%E6%B8%A9%E5%BA%A6.db' },
  }))
  const api = createApiClient('')
  assert.equal((await api.getBackup()).filename, '温度.db')
  globalThis.fetch.mock.mockImplementation(async () => new Response(backupBytes))
  assert.equal((await api.getBackup()).filename, 'switchbot_backup.db')
})

test('includes the backend request ID on backup errors', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({ request_id: 'test-request' }, { status: 500 }))
  await assert.rejects(createApiClient('').getBackup(), /HTTP 500\. Request ID: test-request/)
})

test('rejects an HTML fallback instead of downloading it as a database', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('<!doctype html><title>Temp Master Dashboard</title>'))
  await assert.rejects(createApiClient('').getBackup(), /did not return a SQLite backup/)
})
