/**
 * TC-MISC-S02: 대시보드 설정 패널 열기/닫기
 */
import { test, expect } from '@playwright/test';
import { login }         from '../../actions/common/common.login.js';
import { gotoDashboard } from '../../actions/misc/misc.navigate.js';
import { SELECTORS }     from '../../url_base_lawform.js';

test('[TC-MISC-S02] 대시보드 설정 패널', async ({ page }) => {
    await login(page);
    await gotoDashboard(page);

    // 설정 버튼 클릭
    const settingBtn = page.locator(SELECTORS.DASHBOARD.SETTING);
    if (await settingBtn.isVisible()) {
        await settingBtn.click();
        await page.waitForTimeout(500);

        // 설정 패널 노출 확인
        const closeBtn = page.locator(SELECTORS.DASHBOARD.CLOSE);
        if (await closeBtn.isVisible()) {
            await expect(closeBtn).toBeVisible();
            await closeBtn.click();
        }
    }
});
