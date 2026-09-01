/**
 * [Action] CLM — 인감 사용 신청 / 승인 / 반려
 */
import { URLS } from '../../util/url_base_lawform.js';

function getEnv(key) {
    if (typeof __ENV !== 'undefined' && __ENV[key]) return __ENV[key];
    if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
    return null;
}

/** 인감 사용 신청 */
export async function requestSeal(page) {
    const requestBtn = page.locator('//button[text()="인감 사용 신청"]').first();
    await requestBtn.waitFor({ state: 'visible', timeout: 10000 });
    await requestBtn.click();
    await page.waitForTimeout(500);
    const confirmBtn = page.locator('//button[text()="확인"]').last();
    if (await confirmBtn.isVisible()) await confirmBtn.click();
    await page.waitForLoadState('networkidle');
}

/** 인감 승인 (seal 검토 목록에서 진입) */
export async function approveSeal(page) {
    const sealId = getEnv('SEAL_ID');
    if (sealId) {
        await page.goto(`${URLS.SEAL.REVIEW}/${sealId}`);
    } else {
        await page.goto(URLS.SEAL.REVIEW);
        await page.waitForLoadState('networkidle');
        const firstRow = page.locator('table tbody tr').first();
        if (!await firstRow.isVisible()) return;
        await firstRow.click();
    }
    await page.waitForLoadState('networkidle');

    const approveBtn = page.locator('//button[text()="승인"]').first();
    await approveBtn.waitFor({ state: 'visible', timeout: 10000 });
    await approveBtn.click();
    await page.waitForTimeout(500);
    const confirmBtn = page.locator('//button[text()="확인"]').last();
    if (await confirmBtn.isVisible()) await confirmBtn.click();
    await page.waitForLoadState('networkidle');
}

/**
 * 인감 반려
 * @param {import('k6/browser').Page} page
 * @param {string} [reason]
 */
export async function denySeal(page, reason) {
    const r = reason || getEnv('DENY_REASON') || '자동화 테스트 반려';
    const denyBtn = page.locator('//button[text()="반려"]').first();
    await denyBtn.waitFor({ state: 'visible', timeout: 10000 });
    await denyBtn.click();
    await page.waitForTimeout(500);
    const reasonInput = page.locator('textarea').first();
    if (await reasonInput.isVisible()) await reasonInput.fill(r);
    const confirmBtn = page.locator('//button[text()="확인"]').last();
    await confirmBtn.click();
    await page.waitForLoadState('networkidle');
}
