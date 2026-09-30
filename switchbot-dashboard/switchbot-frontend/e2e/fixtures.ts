import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect } from '@playwright/test'
import type { Page, TestInfo } from '@playwright/test'

const dateDaysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

export const activeMeters = [
  {
    device_id: 'meter-bedroom',
    device_name: 'Bedroom Meter',
    device_type: 'Meter',
    hub_device_id: null,
    current_temperature: 19.8,
    current_humidity: 45,
    battery: 82,
    last_updated: dateDaysAgo(0),
  },
  {
    device_id: 'meter-outside',
    device_name: '外',
    device_type: 'MeterPlus',
    hub_device_id: 'hub-01',
    current_temperature: 22.1,
    current_humidity: 51,
    battery: 76,
    last_updated: dateDaysAgo(0),
  },
  {
    device_id: 'meter-unknown',
    device_name: 'Unknown Sensor',
    device_type: 'Meter',
    hub_device_id: null,
    current_temperature: 17.2,
    current_humidity: 39,
    battery: 90,
    last_updated: dateDaysAgo(0),
  },
]

export const staleMeters = [
  {
    device_id: 'meter-stale',
    device_name: 'Old Sensor',
    device_type: 'Meter',
    hub_device_id: null,
    current_temperature: 12.5,
    current_humidity: 30,
    battery: 10,
    last_updated: dateDaysAgo(8),
  },
  {
    device_id: 'meter-no-data',
    device_name: 'No Data Sensor',
    device_type: 'Meter',
    hub_device_id: null,
    current_temperature: null,
    current_humidity: null,
    battery: null,
    last_updated: null,
  },
]

export interface MockOptions {
  metersStatus?: number
  statusStatus?: number
  refreshStatus?: number
  rateLimited?: boolean
  refreshDelayMs?: number
  meterResponseOverrides?: Array<{ delayMs?: number; firstMeterTemperature?: number }>
}

export interface HistoryRequest {
  deviceId: string
  timeScale: string | null
}

export interface MockBackend {
  historyRequests: HistoryRequest[]
  meterRequests: number
  completedMeterRequests: number
  refreshRequests: number
}

export async function mockBackend(page: Page, options: MockOptions = {}): Promise<MockBackend> {
  const state: MockBackend = { historyRequests: [], meterRequests: 0, completedMeterRequests: 0, refreshRequests: 0 }
  const meters = [...activeMeters, ...staleMeters]
  await page.context().route('**/api/backup', (route) => route.fulfill({
    status: 200,
    contentType: 'text/html',
    body: '<!doctype html><title>Backup fixture</title>',
  }))
  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname

    if (path === '/api/meters' && request.method() === 'GET') {
      state.meterRequests += 1
      const override = options.meterResponseOverrides?.[state.meterRequests - 1]
      if (override?.delayMs) {
        await new Promise((resolveDelay) => setTimeout(resolveDelay, override.delayMs))
      }
      const status = options.metersStatus ?? 200
      const responseMeters = override?.firstMeterTemperature === undefined
        ? meters
        : meters.map((meter, index) => index === 0
          ? { ...meter, current_temperature: override.firstMeterTemperature }
          : meter)
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(status === 200 ? { meters: responseMeters, last_updated: dateDaysAgo(0) } : { detail: 'Meters unavailable' }),
      })
      state.completedMeterRequests += 1
      return
    }

    if (path === '/api/status') {
      const status = options.statusStatus ?? 200
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(status === 200 ? {
          configured: true,
          meters_count: meters.length,
          is_rate_limited: options.rateLimited ?? false,
          backoff_remaining: options.rateLimited ? 120 : 0,
          last_api_call: dateDaysAgo(0),
          collection_interval: 120,
        } : { detail: 'Status unavailable' }),
      })
      return
    }

    if (path === '/api/meters/refresh' && request.method() === 'POST') {
      state.refreshRequests += 1
      if (options.refreshDelayMs) {
        await new Promise((resolveDelay) => setTimeout(resolveDelay, options.refreshDelayMs))
      }
      const status = options.refreshStatus ?? 200
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(status === 200 ? { status: 'ok' } : { detail: 'Refresh failed' }),
      })
      return
    }

    const match = path.match(/^\/api\/meters\/([^/]+)\/history$/)
    if (match && request.method() === 'GET') {
      const deviceId = decodeURIComponent(match[1])
      const timeScale = url.searchParams.get('time_scale')
      state.historyRequests.push({ deviceId, timeScale })
      const history = Array.from({ length: 24 }, (_, index) => ({
        timestamp: new Date(Date.now() - (23 - index) * 60 * 60 * 1000).toISOString(),
        temperature: 18 + Math.sin(index / 3) * 2,
        humidity: 40 + index % 10,
        battery: 80,
      }))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ device_id: deviceId, time_scale: timeScale, history, device: null }),
      })
      return
    }

    await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ detail: 'Not found' }) })
  })
  return state
}

export async function saveScenarioScreenshot(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  await waitForChartHistory(page)
  const screenshotPath = resolve('e2e-artifacts/screenshots', `${name}.png`)
  mkdirSync(resolve('e2e-artifacts/screenshots'), { recursive: true })
  const screenshot = await page.screenshot({ path: screenshotPath, fullPage: true })
  await testInfo.attach(name, { body: screenshot, contentType: 'image/png' })
}

export async function waitForChartHistory(page: Page): Promise<void> {
  const charts = page.locator('canvas[data-testid^="chart-"]')
  const chartCount = await charts.count()
  for (let index = 0; index < chartCount; index += 1) {
    await expect(charts.nth(index).locator('xpath=..')).toHaveAttribute('data-points', '24')
  }
}
