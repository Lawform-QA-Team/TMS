/**
 * [Action] Seal — 페이지 이동
 */
import { URLS } from '../../util/url_base_lawform.js';

function getEnv(key) {
    if (typeof __ENV !== 'undefined' && __ENV[key]) return __ENV[key];
    if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
    return null;
}

export async function gotoReviewList(page) {
    await page.goto(URLS.SEAL.REVIEW);
    await page.waitForLoadState('networkidle');
}

export async function gotoLedger(page) {
    await page.goto(URLS.SEAL.LEDGER);
    await page.waitForLoadState('networkidle');
}

export async function gotoDraftList(page) {
    await page.goto(URLS.SEAL.DRAFT);
    await page.waitForLoadState('networkidle');
}

/**
 * SEAL_ID 환경변수가 있으면 직접 진입, 없으면 목록 첫 행 클릭
 * @param {import('k6/browser').Page} page
 */
export async function gotoDetailOrFirst(page) {
    const sealId = getEnv('SEAL_ID');
    if (sealId) {
        await page.goto(`${URLS.SEAL.REVIEW}/${sealId}`);
        await page.waitForLoadState('networkidle');
    } else {
        await page.goto(URLS.SEAL.REVIEW);
        await page.waitForLoadState('networkidle');
        const firstRow = page.locator('table tbody tr').first();
        if (!await firstRow.isVisible()) {
            console.log('[seal.navigate] 목록에 항목 없음 — 스킵');
            return false;
        }
        await firstRow.click();
        await page.waitForLoadState('networkidle');
    }
    return true;
}
