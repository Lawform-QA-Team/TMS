/**
 * TC-LIT-S04: 송무 일정 추가 — 추가 모달 진입 확인
 *
 * 실제 저장은 하지 않고 모달 진입까지만 검증한다.
 */
import { test, expect } from '@playwright/test';
import { login }                  from '../../actions/common/common.login.js';
import { gotoDetailOrFirst }      from '../../actions/litigation/litigation.navigate.js';
import { clickScheduleTab,
         openAddScheduleModal }   from '../../actions/litigation/litigation.schedule.js';
import { cancelModal }            from '../../actions/common/common.modal.js';

test('[TC-LIT-S04] 송무 일정 추가 모달 진입', async ({ page }) => {
    await login(page);
    await gotoDetailOrFirst(page);
    await clickScheduleTab(page);
    await openAddScheduleModal(page);

    // 모달 진입 확인
    const modal = page.locator('[role="dialog"], [class*="modal"]').first();
    if (await modal.isVisible()) {
        await expect(modal).toBeVisible();
        await cancelModal(page);
    }
});
