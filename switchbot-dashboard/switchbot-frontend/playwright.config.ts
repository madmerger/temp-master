import { defineConfig } from '@playwright/test';

const API_URL = process.env.VITE_API_URL || 'https://temp-master.fly.dev';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 1,
  use: {
    headless: true,
  },
  projects: [
    {
      name: 'api-smoke',
      testMatch: /api\.spec\.ts/,
      use: { baseURL: API_URL },
    },
    {
      name: 'ui',
      testMatch: /ui\.spec\.ts/,
      use: {
        baseURL: 'http://localhost:4173',
        browserName: 'chromium',
      },
    },
  ],
  webServer: {
    command: 'npm run preview -- --port 4173',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
  reporter: [['html', { open: 'never' }]],
});
