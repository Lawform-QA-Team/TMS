/**
 * LawForm E2E 전용 Playwright 설정
 *
 * 실행 (전체):
 *   npx playwright test --config=lawform/playwright.lawform.config.js
 *
 * 특정 도메인:
 *   npx playwright test --config=lawform/playwright.lawform.config.js --grep "CLM"
 *   npx playwright test --config=lawform/playwright.lawform.config.js --grep "ADV"
 *
 * 버그 리그레션만:
 *   npx playwright test --config=lawform/playwright.lawform.config.js --grep "BUG-"
 *
 * 특정 TC:
 *   npx playwright test --config=lawform/playwright.lawform.config.js --grep "TC-CLM-S04"
 */
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export default defineConfig({
    testDir: __dirname,

    // scenarios/**/*.scenario.js 파일 전체 자동 discovery
    testMatch: ['scenarios/**/*.scenario.js'],

    timeout: Number(process.env.TEST_TIMEOUT) || 120000,

    // E2E 특성상 순차 실행 — 서버 상태가 테스트 간 공유됨
    fullyParallel: false,
    workers: 1,

    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,

    reporter: [
        ['list'],
        ['html', { outputFolder: 'lawform-report', open: 'never' }],
    ],

    use: {
        baseURL: process.env.LAWFORM_BASE_URL || process.env.BASE_URL || 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
