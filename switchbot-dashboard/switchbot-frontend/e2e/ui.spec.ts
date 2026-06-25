import { test, expect } from '@playwright/test';

test.describe('Dashboard UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows the dashboard title', async ({ page }) => {
    await expect(page.locator('.navbar-brand')).toHaveText('Temp Master Dashboard');
  });

  test('renders the controls panel', async ({ page }) => {
    await expect(page.locator('#time-scale-select')).toBeVisible();
    await expect(page.locator('button:has-text("Refresh Data")')).toBeVisible();
    await expect(page.locator('a:has-text("Download Backup")')).toBeVisible();
  });

  test('shows connection status badge', async ({ page }) => {
    const badge = page.locator('.badge-success, .badge-danger');
    await expect(badge).toBeVisible();
  });

  test('theme selector is visible and functional', async ({ page }) => {
    const themeSelector = page.locator('.theme-selector');
    await expect(themeSelector).toBeVisible();

    const darkBtn = page.locator('.theme-btn:has-text("Dark")');
    await darkBtn.click();
    await expect(darkBtn).toHaveClass(/active/);

    const bgColor = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim(),
    );
    expect(bgColor).toBe('#121212');
  });

  test('theme persists in localStorage', async ({ page }) => {
    await page.locator('.theme-btn:has-text("Industrial")').click();

    const stored = await page.evaluate(() => localStorage.getItem('temp-master-theme'));
    expect(stored).toBe('industrial');

    await page.reload();
    await expect(page.locator('.theme-btn:has-text("Industrial")')).toHaveClass(/active/);
  });

  test('time scale selector changes value', async ({ page }) => {
    const select = page.locator('#time-scale-select');
    await select.selectOption('week');
    await expect(select).toHaveValue('week');
  });
});
