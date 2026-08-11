/**
 * TC-LIT-S05: 송무 전체 일정 조회 — 월/주/일 뷰 전환
 */
import { test, expect } from '@playwright/test';
import { login }               from '../../actions/common/common.login.js';
import { gotoScheduleAll }     from '../../actions/litigation/litigation.navigate.js';
import { switchCalendarView }  from '../../actions/litigation/litigation.schedule.js';

test('[TC-LIT-S05] 송무 전체 일정 조회 — 월/주/일 뷰 전환', async ({ page }) => {
    await login(page);
    await gotoScheduleAll(page);
    await expect(page).toHaveURL(/\/litigation\/schedule/);

    await switchCalendarView(page, 'month');
    await switchCalendarView(page, 'week');
    await switchCalendarView(page, 'day');
});
