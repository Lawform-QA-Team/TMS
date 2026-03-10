// reporter/playwright.config.ts
import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import * as path from 'path';

// ES Module에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export default defineConfig({
  testDir: '../tests',

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
      use: {
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
});