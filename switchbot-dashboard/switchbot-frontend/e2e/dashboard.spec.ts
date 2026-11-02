import { expect } from '@playwright/test'
import { ACTIVE_DEVICE_IDS, FIXED_NOW, STALE_DEVICE_IDS } from './fixtures/scenario'
import { openDashboard, test } from './support'

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date(FIXED_NOW) })
  await page.clock.setFixedTime(new Date(FIXED_NOW))
})

test('initial load renders active meters, aliases, status, and charts', async ({
  api,
  page,
}, testInfo) => {
  await openDashboard(page)

  await expect(page.getByTestId('connection-status')).toHaveText('Connected')
  await expect(page.getByText('Monitoring 6 meters')).toBeVisible()
  await expect(page.getByTestId('meter-card')).toHaveCount(6)

  const bedroom = page.locator('[data-device-id="C76B0046301A"]')
  await expect(bedroom).toContainText('第1蒸留塔 (T-101)')
  await expect(bedroom).toContainText('20°C')
  await expect(bedroom).toContainText('71%')
  await expect(bedroom).toContainText('20%')

  const coolingTower = page.locator('[data-device-id="D13234351576"]')
  await expect(coolingTower).toContainText('冷却塔 (CT-401)')
  await expect(coolingTower).toContainText('26.8°C')
  await expect(coolingTower).toContainText('68%')
  await expect(coolingTower).toContainText('100%')

  const hub = page.locator('[data-device-id="B0E9FEB9CFA6"]')
  await expect(hub).toContainText('制御盤 (CP-1602)')
  await expect(hub).toContainText('18.9°C')
  await expect(hub).toContainText('65%')
  await expect(hub).not.toContainText('100%')

  const unmapped = page.locator('[data-device-id="A1B2C3D4E5F6"]')
  await expect(unmapped).toContainText('Garage Sensor')
  await expect(unmapped).toContainText('15.2°C')
  await expect(unmapped).toContainText('55%')
  await expect(unmapped).toContainText('80%')

  await expect(page.locator('canvas')).toHaveCount(4)
  const staleSection = page.getByRole('region', { name: '未更新のメーター' })
  await expect(staleSection.locator('canvas')).toHaveCount(0)
  await expect
    .poll(
      () => new Set(api.historyRequests.map(({ deviceId }) => deviceId)).size,
    )
    .toBe(ACTIVE_DEVICE_IDS.length)
  await expect
    .poll(
      () => new Set(api.historyResponses.map(({ deviceId }) => deviceId)).size,
    )
    .toBe(ACTIVE_DEVICE_IDS.length)
  expect(
    [...new Set(api.historyRequests.map(({ deviceId }) => deviceId))].sort(),
  ).toEqual([...ACTIVE_DEVICE_IDS].sort())
  expect(
    api.historyRequests.some(({ deviceId }) => STALE_DEVICE_IDS.includes(deviceId)),
  ).toBe(false)

  const screenshotPath = testInfo.outputPath('initial-dashboard.png')
  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
  })
  await testInfo.attach('initial-dashboard', {
    path: screenshotPath,
    contentType: 'image/png',
  })
})

test('time-range selection requests history for active meters and updates charts', async ({
  api,
  page,
}) => {
  await openDashboard(page)
  const chart = page.locator(`[data-device-id="${ACTIVE_DEVICE_IDS[0]}"] canvas`)
  await expect(chart).toBeVisible()
  let previousImage = await chart.evaluate((canvas) =>
    (canvas as HTMLCanvasElement).toDataURL(),
  )

  for (const timeScale of ['hour', 'week', 'month', 'year'] as const) {
    api.historyRequests.length = 0
    api.historyResponses.length = 0
    await page.getByLabel('Time Range:').selectOption(timeScale)

    await expect
      .poll(
        () =>
          new Set(
            api.historyResponses
              .filter((request) => request.timeScale === timeScale)
              .map(({ deviceId }) => deviceId),
          ).size,
      )
      .toBe(ACTIVE_DEVICE_IDS.length)

    expect(
      api.historyRequests.map(({ deviceId }) => deviceId).sort(),
    ).toEqual([...ACTIVE_DEVICE_IDS].sort())
    expect(
      api.historyRequests.every((request) => request.timeScale === timeScale),
    ).toBe(true)
    expect(
      api.historyRequests.some(({ deviceId }) => STALE_DEVICE_IDS.includes(deviceId)),
    ).toBe(false)

    await expect
      .poll(() =>
        chart.evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL()),
      )
      .not.toBe(previousImage)
    previousImage = await chart.evaluate((canvas) =>
      (canvas as HTMLCanvasElement).toDataURL(),
    )
  }
})

test('theme toggle persists and system preference sets the default', async ({
  api,
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await openDashboard(page)

  const root = page.locator('html')
  await expect(root).toHaveAttribute('data-theme', 'dark')
  await page.getByRole('button', { name: 'Switch to light mode' }).click()
  await expect(root).toHaveAttribute('data-theme', 'light')
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('temp-master-theme')))
    .toBe('light')

  await page.reload()
  await expect(root).toHaveAttribute('data-theme', 'light')

  await page.evaluate(() => localStorage.removeItem('temp-master-theme'))
  await page.emulateMedia({ colorScheme: 'light' })
  await page.reload()
  await expect(root).toHaveAttribute('data-theme', 'light')
  expect(api.unmockedApiRequests).toEqual([])
})

test('refresh posts and displays the updated meter response', async ({
  api,
  page,
}) => {
  await openDashboard(page)
  const bedroom = page.locator('[data-device-id="C76B0046301A"]')
  await expect(bedroom).toContainText('20°C')

  await page.getByRole('button', { name: 'Refresh Data' }).click()

  await expect(bedroom).toContainText('21°C')
  expect(api.refreshRequests).toBe(1)
  expect(api.metersRequests).toBe(2)
})

test('refresh errors remain visible after meters reload', async ({ api, page }) => {
  api.failRefresh = true
  await openDashboard(page)

  await page.getByRole('button', { name: 'Refresh Data' }).click()

  await expect(page.getByRole('alert')).toContainText(
    'Failed to refresh: HTTP 500',
  )
  await expect(page.getByTestId('connection-status')).toHaveText('Connected')
  expect(api.refreshRequests).toBe(1)
  expect(api.metersRequests).toBe(2)
})

test('stale meters are labeled and have no history charts', async ({
  api,
  page,
}) => {
  await openDashboard(page)

  const staleSection = page.getByRole('region', { name: '未更新のメーター' })
  await expect(staleSection.locator('h2')).toContainText('未更新のメーター')
  await expect(staleSection.locator('p').first()).toHaveText(
    '1週間以上更新されていないデバイス',
  )
  await expect(staleSection.getByTestId('meter-card')).toHaveCount(2)

  const staleMeter = page.locator('[data-device-id="F577B677EC96"]')
  await expect(staleMeter).toContainText('熱交換器 (E-301)')
  await expect(staleMeter).toContainText('7日以上未更新')
  await expect(staleMeter).toContainText('履歴データの取得対象外')

  const noDataMeter = page.locator('[data-device-id="000000000000"]')
  await expect(noDataMeter).toContainText('Unknown Meter')
  await expect(noDataMeter).toContainText('7日以上未更新')
  await expect(noDataMeter).toContainText('値がありません（データ未受信）')
  await expect(staleSection.locator('canvas')).toHaveCount(0)

  expect(
    api.historyRequests.some(({ deviceId }) => STALE_DEVICE_IDS.includes(deviceId)),
  ).toBe(false)
})

test('API failures disconnect and recover on the next poll', async ({
  api,
  page,
}) => {
  api.failFirstMetersRequest = true
  await openDashboard(page)

  await expect(page.getByTestId('connection-status')).toHaveText('Disconnected')
  await expect(page.getByRole('alert')).toContainText(
    'Failed to fetch meters: HTTP 500',
  )

  await page.clock.runFor(30_000)

  await expect(page.getByTestId('connection-status')).toHaveText('Connected')
  await expect(page.getByRole('alert')).toHaveCount(0)
  expect(api.metersRequests).toBe(2)
})
