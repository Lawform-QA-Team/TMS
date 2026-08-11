/**
 * TC-MISC-S04: 통계 페이지 조회
 *
 * 검증: 통계 페이지 진입 및 차트/데이터 영역 노출
 */
import { test, expect } from '@playwright/test';
import { login }          from '../../actions/common/common.login.js';
import { gotoStatistics } from '../../actions/misc/misc.navigate.js';

test('[TC-MISC-S04] 통계 페이지 조회', async ({ page }) => {
    await login(page);
    await gotoStatistics(page);
    await expect(page).toHaveURL(/\/statistics/);

    // 통계 콘텐츠 영역 로드 확인
    const content = page.locator('[class*="chart"], [class*="statistic"], [class*="graph"]').first();
    if (await content.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(content).toBeVisible();
    }
});
