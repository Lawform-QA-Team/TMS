/**
 * 송무 전체 일정 조회 - Playwright E2E
 *
 * 커버하는 시나리오:
 * 1. 송무 전체 일정 페이지 진입
 * 2. 일정 목록 스크린샷
 * 3. 월/주/일 뷰 전환 확인
 */
import { URLS } from '../../url_base_lawform.js';
import { getFormattedTimestamp } from '../../../common/utils.js';
import { getCredentials, loginWithPage } from '../login/login_helper.js';

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
    const credentials = getCredentials();
    const ts = () => getFormattedTimestamp().replace(/:/g, '_');

    await loginWithPage(page, credentials);

    // ── 1. 전체 일정 페이지 진입 ─────────────────────────────────────
    await page.goto(URLS.LITIGATION.SCHEDULE);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `screenshots/${ts()}_litigation_schedule_all.png` });

    // ── 2. 뷰 전환 버튼 확인 (월/주/일) ────────────────────────────
    const monthBtn = page.locator('button:has-text("월")').first();
    if (await monthBtn.isVisible()) {
        await monthBtn.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: `screenshots/${ts()}_litigation_schedule_month.png` });
    }

    const weekBtn = page.locator('button:has-text("주")').first();
    if (await weekBtn.isVisible()) {
        await weekBtn.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: `screenshots/${ts()}_litigation_schedule_week.png` });
    }

    const dayBtn = page.locator('button:has-text("일")').first();
    if (await dayBtn.isVisible()) {
        await dayBtn.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: `screenshots/${ts()}_litigation_schedule_day.png` });
    }
}
