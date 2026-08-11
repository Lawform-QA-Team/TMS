/**
 * Misc 네비게이션 액션 (대시보드 / 대량 문서 / 통계 / 설정)
 */
import { URLS } from '../../url_base_lawform.js';

export async function gotoDashboard(page) {
    await page.goto(URLS.LOGIN.DASHBOARD);
    await page.waitForLoadState('networkidle');
}

export async function gotoBulkList(page) {
    await page.goto(URLS.BULK.BULK);
    await page.waitForLoadState('networkidle');
}

export async function gotoStatistics(page) {
    await page.goto(URLS.STATISTICS.STATISTICS);
    await page.waitForLoadState('networkidle');
}

export async function gotoSetup(page) {
    await page.goto(URLS.SETTING.SETUP);
    await page.waitForLoadState('networkidle');
}
