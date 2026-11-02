import { expect, test as base, type Page } from '@playwright/test'
import type { TimeScale } from '../src/types'
import {
  createHistoryResponse,
  MOCK_METERS_RESPONSE,
  MOCK_STATUS,
} from './fixtures/scenario'

export interface HistoryRequest {
  deviceId: string
  timeScale: string | null
}

export interface MockApiState {
  metersRequests: number
  refreshRequests: number
  historyRequests: HistoryRequest[]
  historyResponses: HistoryRequest[]
  unmockedApiRequests: string[]
  failFirstMetersRequest: boolean
  failRefresh: boolean
}

export const test = base.extend<{ api: MockApiState }>({
  api: async ({ page }, provide) => {
    const state: MockApiState = {
      metersRequests: 0,
      refreshRequests: 0,
      historyRequests: [],
      historyResponses: [],
      unmockedApiRequests: [],
      failFirstMetersRequest: false,
      failRefresh: false,
    }

    await page.route('**/api/**', async (route) => {
      const request = route.request()
      const url = new URL(request.url())
      const method = request.method()

      if (method === 'GET' && url.pathname === '/api/meters') {
        state.metersRequests += 1
        if (state.failFirstMetersRequest && state.metersRequests === 1) {
          await route.fulfill({
            status: 500,
            json: { detail: 'meters unavailable' },
          })
          return
        }

        const response = structuredClone(MOCK_METERS_RESPONSE)
        if (state.metersRequests === 2) {
          response.meters[0].current_temperature = 21
        }
        await route.fulfill({ json: response })
        return
      }

      if (method === 'GET' && url.pathname === '/api/status') {
        await route.fulfill({ json: MOCK_STATUS })
        return
      }

      if (method === 'POST' && url.pathname === '/api/meters/refresh') {
        state.refreshRequests += 1
        await route.fulfill({
          status: state.failRefresh ? 500 : 200,
          json: state.failRefresh
            ? { detail: 'refresh unavailable' }
            : { status: 'ok', message: 'Refresh complete', meters_count: 6 },
        })
        return
      }

      const historyMatch = url.pathname.match(
        /^\/api\/meters\/([^/]+)\/history$/,
      )
      if (method === 'GET' && historyMatch) {
        const deviceId = decodeURIComponent(historyMatch[1])
        const timeScale = url.searchParams.get('time_scale')
        const requestInfo = { deviceId, timeScale }
        state.historyRequests.push(requestInfo)

        if (
          timeScale === 'hour' ||
          timeScale === 'day' ||
          timeScale === 'week' ||
          timeScale === 'month' ||
          timeScale === 'year'
        ) {
          await route.fulfill({
            json: createHistoryResponse(deviceId, timeScale as TimeScale),
          })
          state.historyResponses.push(requestInfo)
          return
        }
      }

      state.unmockedApiRequests.push(`${method} ${url.pathname}${url.search}`)
      await route.fulfill({
        status: 500,
        json: { detail: 'Unmocked API request' },
      })
    })

    await provide(state)
    expect(state.unmockedApiRequests).toEqual([])
  },
})

export async function openDashboard(page: Page): Promise<void> {
  await page.goto('/')
  await page.clock.runFor(1)
}
