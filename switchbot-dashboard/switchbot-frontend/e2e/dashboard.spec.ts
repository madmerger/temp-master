import { expect, test } from '@playwright/test'
import { activeMeters, mockBackend, saveScenarioScreenshot, staleMeters, waitForChartHistory } from './fixtures'

test('初期表示 / Initial dashboard', async ({ page }) => {
  await mockBackend(page)
  await page.goto('/')

  await expect(page).toHaveTitle('Temp Master Dashboard')
  await expect(page.getByRole('link', { name: 'Temp Master Dashboard' })).toBeVisible()
  await expect(page.getByTestId('connection-status')).toHaveText('Connected')
  await expect(page.getByTestId('loading')).toBeHidden()
  await expect(page.getByTestId('status-meters-count')).toHaveText('Monitoring 5 meters')
  await expect(page.getByTestId('status-last-refresh')).toHaveText(/^Last refresh: \d{2}:\d{2}:\d{2}$/)
  await expect(page.locator('footer')).toHaveText('Temp Master Dashboard v1.0 - Built with React + Tailwind CSS')
})

test('メーターカード描画 / Meter cards', async ({ page }) => {
  await mockBackend(page)
  await page.goto('/')
  await expect(page.getByTestId('loading')).toBeHidden()
  await waitForChartHistory(page)

  await expect(page.getByText('第1蒸留塔 (T-101)')).toBeVisible()
  await expect(page.getByText('屋外モニター (EM-1101)')).toBeVisible()
  await expect(page.getByText('Unknown Sensor')).toBeVisible()
  await expect(page.getByTestId('meter-card-meter-bedroom')).toContainText('19.8°C')
  await expect(page.getByTestId('meter-card-meter-bedroom')).toContainText('45%')
  await expect(page.getByTestId('meter-card-meter-bedroom')).toContainText('82%')
  await expect(page.getByTestId('meter-card-meter-outside')).toContainText('MeterPlus')
  await expect(page.getByTestId('chart-meter-bedroom')).toBeVisible()
  await expect(page.getByTestId('chart-meter-outside')).toBeVisible()
  await expect(page.getByTestId('chart-meter-unknown')).toBeVisible()
  await expect(page.getByTestId('meter-card-meter-bedroom')).toContainText('Last updated:')
})

test('タイムスケール切替 / History time scales', async ({ page }) => {
  const backend = await mockBackend(page)
  await page.goto('/')

  await expect.poll(() => backend.historyRequests.length).toBe(activeMeters.length)
  expect(backend.historyRequests).toEqual(expect.arrayContaining(
    activeMeters.map(({ device_id }) => ({ deviceId: device_id, timeScale: 'day' })),
  ))

  const select = page.getByTestId('time-scale-select')
  for (const timeScale of ['hour', 'week', 'month', 'year']) {
    const previousCount = backend.historyRequests.length
    await select.selectOption(timeScale)
    await expect.poll(() => backend.historyRequests.length).toBe(previousCount + activeMeters.length)
    expect(backend.historyRequests.slice(previousCount).every((request) => request.timeScale === timeScale)).toBe(true)
  }
  expect(backend.historyRequests.every(({ deviceId }) => activeMeters.some((meter) => meter.device_id === deviceId))).toBe(true)
})

test('ダークテーマ / Theme preference and persistence', async ({ page }, testInfo) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await mockBackend(page)
  await page.goto('/')
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await expect(page.getByTestId('theme-toggle-system')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('loading')).toBeHidden()
  await saveScenarioScreenshot(page, testInfo, 'light')

  await page.emulateMedia({ colorScheme: 'dark' })
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.getByTestId('theme-toggle-dark').click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.getByTestId('theme-toggle-dark')).toHaveAttribute('aria-pressed', 'true')
  await expect.poll(() => page.evaluate(() => localStorage.getItem('theme'))).toBe('dark')
  await expect(page.getByTestId('chart-meter-bedroom')).toBeVisible()
  await expect(page.getByTestId('chart-meter-outside')).toBeVisible()
  await expect(page.getByTestId('chart-meter-unknown')).toBeVisible()
  const bodyBackgroundLuminance = await page.locator('body').evaluate((element) => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) return 1
    context.fillStyle = getComputedStyle(element).backgroundColor
    context.fillRect(0, 0, 1, 1)
    const [red, green, blue] = context.getImageData(0, 0, 1, 1).data
    return (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255
  })
  expect(bodyBackgroundLuminance).toBeLessThan(0.2)
  await saveScenarioScreenshot(page, testInfo, 'dark')

  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await expect(page.getByTestId('theme-toggle-dark')).toHaveAttribute('aria-pressed', 'true')
  await page.getByTestId('theme-toggle-light').click()
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await expect(page.getByTestId('theme-toggle-light')).toHaveAttribute('aria-pressed', 'true')
})

test('古いメーターのセクション / Stale meter cards', async ({ page }, testInfo) => {
  const backend = await mockBackend(page)
  await page.goto('/')
  const staleSection = page.getByTestId('stale-meters-section')

  await expect(staleSection.getByRole('heading', { name: '未更新のメーター' })).toBeVisible()
  await expect(staleSection).toContainText('1週間以上更新されていないデバイス')
  await expect(staleSection).toContainText('7日以上未更新')
  await expect(staleSection).toContainText('履歴データの取得対象外')
  await expect(staleSection).toContainText('値がありません（データ未受信）')
  await expect(staleSection.getByTestId('meter-card-meter-stale')).toHaveAttribute('data-stale', 'true')
  await expect(page.getByTestId('active-meters').getByTestId('meter-card-meter-bedroom')).toHaveAttribute('data-stale', 'false')
  await expect(page.getByTestId('chart-meter-stale')).toHaveCount(0)
  await expect(page.getByTestId('chart-meter-no-data')).toHaveCount(0)
  expect(backend.historyRequests.every(({ deviceId }) => !staleMeters.some((meter) => meter.device_id === deviceId))).toBe(true)
  await saveScenarioScreenshot(page, testInfo, 'stale-meters')
})

test('meters API エラー / Meters request error', async ({ page }, testInfo) => {
  await mockBackend(page, { metersStatus: 500 })
  await page.goto('/')

  await expect(page.getByTestId('error-alert')).toContainText('Failed to fetch meters: HTTP 500')
  await expect(page.getByTestId('connection-status')).toHaveText('Disconnected')
  await saveScenarioScreenshot(page, testInfo, 'error-state')
})

test('status API エラー / Status request error', async ({ page }) => {
  await mockBackend(page, { statusStatus: 500 })
  await page.goto('/')

  await expect(page.getByTestId('error-alert')).toContainText('Failed to fetch status: HTTP 500')
  await expect(page.getByTestId('connection-status')).toHaveText('Disconnected')
})

test('refresh API エラー / Refresh request error', async ({ page }) => {
  await mockBackend(page, { refreshStatus: 500 })
  await page.goto('/')
  await page.getByTestId('btn-refresh').click()

  await expect(page.getByTestId('error-alert')).toContainText('Failed to refresh: HTTP 500')
  await expect(page.getByTestId('btn-refresh')).toHaveText('Refresh Data')
})

test('レート制限の警告 / Rate limit warning', async ({ page }) => {
  await mockBackend(page, { rateLimited: true })
  await page.goto('/')

  await expect(page.getByTestId('rate-limit-warning')).toContainText('Retry in 120 seconds.')
})

test('手動更新・バックアップ・自動更新 / Refresh, backup and auto refresh', async ({ page }) => {
  const backend = await mockBackend(page, { refreshDelayMs: 500 })
  await page.goto('/')
  await expect(page.getByTestId('loading')).toBeHidden()

  await page.getByTestId('btn-refresh').click()
  await expect(page.getByTestId('btn-refresh')).toHaveText('Refreshing...')
  await expect.poll(() => backend.refreshRequests).toBe(1)
  await expect.poll(() => backend.meterRequests).toBe(2)
  await expect(page.getByTestId('btn-refresh')).toHaveText('Refresh Data')

  const popupPromise = page.waitForEvent('popup')
  await page.getByTestId('btn-backup').click()
  const popup = await popupPromise
  await expect.poll(() => popup.url()).toMatch(/\/api\/backup$/)
  await popup.close()

  await page.clock.install()
  await page.reload()
  await expect(page.getByTestId('loading')).toBeHidden()
  const previousCount = backend.meterRequests
  await page.clock.fastForward(30000)
  await expect.poll(() => backend.meterRequests).toBe(previousCount + 1)
})
