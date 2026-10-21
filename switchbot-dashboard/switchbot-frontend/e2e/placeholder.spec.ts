import { expect, test } from '@playwright/test'

test('shows the dashboard placeholder', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle('Temp Master Dashboard')
  await expect(page.getByRole('heading', { name: 'Temp Master Dashboard' })).toBeVisible()
  await expect(page.locator('body')).not.toContainText(/snake/i)
})
