/**
 * TC-LIT-S03: 송무 일정 조회 — 상세 내 일정 탭 진입
 */
import { test } from '@playwright/test';
import { login }             from '../../actions/common/common.login.js';
import { gotoDetailOrFirst } from '../../actions/litigation/litigation.navigate.js';
import { clickScheduleTab }  from '../../actions/litigation/litigation.schedule.js';

test('[TC-LIT-S03] 송무 일정 탭 조회', async ({ page }) => {
    await login(page);
    await gotoDetailOrFirst(page);
    await clickScheduleTab(page);
});
