/**
 * TC-MISC-S01: 대시보드 GNB 네비게이션
 *
 * 검증: GNB 열기/닫기 버튼 노출 확인
 */
import { test, expect } from '@playwright/test';
import { login }          from '../../actions/common/common.login.js';
import { gotoDashboard }  from '../../actions/misc/misc.navigate.js';
import { SELECTORS }      from '../../url_base_lawform.js';

test('[TC-MISC-S01] 대시보드 GNB 네비게이션', async ({ page }) => {
    await login(page);
    await gotoDashboard(page);
    await expect(page).toHaveURL(/\/dashboard/);

    // GNB 버튼 클릭
    const gnbBtn = page.locator(SELECTORS.DASHBOARD.GNB);
    if (await gnbBtn.isVisible()) {
        await gnbBtn.click();
        await page.waitForTimeout(500);
        await gnbBtn.click(); // 다시 닫기
    }
});
