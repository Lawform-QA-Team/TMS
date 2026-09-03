/**
 * [Action] Misc — 기타 페이지 이동
 */
import { URLS } from '../../util/url_base_lawform.js';

export async function gotoDashboard(page) {
    await page.goto(URLS.LOGIN.DASHBOARD);
    await page.waitForLoadState('networkidle');
}

export async function gotoBulkList(page) {
    await page.goto(URLS.BULK.BULK);
    await page.waitForLoadState('networkidle');
}

export async function gotoSetup(page) {
    await page.goto(URLS.SETTING.SETUP);
    await page.waitForLoadState('networkidle');
}
