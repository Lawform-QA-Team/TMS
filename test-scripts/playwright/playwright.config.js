// selector_audit 실행용 최소 config
// 시스템에 설치된 Chrome을 사용 (별도 브라우저 다운로드 불필요)
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  testDir: '.',
  testMatch: ['**/*.spec.js'],
  timeout: 60000,
  use: {
    channel: 'chrome',
    headless: true,
  },
});
