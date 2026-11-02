import { expect, test } from '@playwright/test'

test('real API smoke check is read-only', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('link', { name: 'Temp Master Dashboard' }),
  ).toBeVisible()
  await expect(page.getByTestId('connection-status')).toHaveText('Connected', {
    timeout: 60_000,
  })
  await expect
    .poll(() => page.getByTestId('meter-card').count(), { timeout: 60_000 })
    .toBeGreaterThan(0)
  await expect
    .poll(() => page.locator('canvas').count(), { timeout: 60_000 })
    .toBeGreaterThan(0)

  const bodyText = await page.locator('body').innerText()
  expect(bodyText).not.toContain('Snake')
})
