/**
 * [Action] CLM — 페이지 이동
 */
import { URLS } from '../../util/url_base_lawform.js';

function getEnv(key) {
    if (typeof __ENV !== 'undefined' && __ENV[key]) return __ENV[key];
    if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
    return null;
}

export async function gotoDraftList(page) {
    await page.goto(URLS.CLM.DRAFT);
    await page.waitForLoadState('networkidle');
}

export async function gotoReviewList(page) {
    await page.goto(URLS.CLM.REVIEW);
    await page.waitForLoadState('networkidle');
}

/**
 * CLM_ID 환경변수가 있으면 해당 URL 직접 진입, 없으면 목록 첫 행 클릭
 * @param {import('k6/browser').Page} page
 * @returns {Promise<boolean>}
 */
export async function gotoDetailOrFirst(page) {
    const clmId = getEnv('CLM_ID');
    if (clmId) {
        await page.goto(`${URLS.CLM.REVIEW}/${clmId}`);
        await page.waitForLoadState('networkidle');
    } else {
        await page.goto(URLS.CLM.REVIEW);
        await page.waitForLoadState('networkidle');
        const firstRow = page.locator('table tbody tr').first();
        if (!await firstRow.isVisible()) {
            console.log('[clm.navigate] 목록에 항목 없음 — 스킵');
            return false;
        }
        await firstRow.click();
        await page.waitForLoadState('networkidle');
    }
    return true;
}
