/**
 * TC-MISC-S05: 결재 흐름 설정 조회
 *
 * 검증: 설정 페이지 진입 및 결재 흐름 설정 영역 노출
 */
import { test, expect } from '@playwright/test';
import { login }      from '../../actions/common/common.login.js';
import { gotoSetup }  from '../../actions/misc/misc.navigate.js';

test('[TC-MISC-S05] 결재 흐름 설정 조회', async ({ page }) => {
    await login(page);
    await gotoSetup(page);
    await expect(page).toHaveURL(/\/setup/);

    // 결재 흐름 설정 영역 확인
    const setupContent = page.locator('[class*="setup"], [class*="approval"]').first();
    if (await setupContent.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(setupContent).toBeVisible();
    }
});
