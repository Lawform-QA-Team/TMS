// reporter/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../test-scripts/playwright/.env') });

export default defineConfig({
  testDir: '../tests',
  timeout: Number(process.env.TEST_TIMEOUT) || 240000,

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['list'],
    ['./slack_reporter.ts'],
    ['./influxdb-reporter.ts', {
      url:    process.env.INFLUXDB_URL,
      token:  process.env.INFLUXDB_TOKEN,
      org:    process.env.INFLUXDB_ORG,
      bucket: process.env.INFLUXDB_BUCKET,
    }],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});