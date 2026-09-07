/**
 * [Action] CLM — 최종 승인 / 반려
 */

function getEnv(key) {
    if (typeof __ENV !== 'undefined' && __ENV[key]) return __ENV[key];
    if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
    return null;
}

/** 최종 승인 */
export async function approveFinalReview(page) {
    const approveBtn = page.locator('//button[text()="최종 승인"]').first();
    await approveBtn.waitFor({ state: 'visible', timeout: 10000 });
    await approveBtn.click();
    await page.waitForTimeout(500);
    const confirmBtn = page.locator('//button[text()="확인"]').last();
    if (await confirmBtn.isVisible()) await confirmBtn.click();
    await page.waitForLoadState('networkidle');
}

/**
 * 최종 반려
 * @param {import('k6/browser').Page} page
 * @param {string} [reason]
 */
export async function denyFinalReview(page, reason) {
    const r = reason || getEnv('DENY_REASON') || '자동화 테스트 반려';
    const denyBtn = page.locator('//button[text()="최종 반려"]').first();
    await denyBtn.waitFor({ state: 'visible', timeout: 10000 });
    await denyBtn.click();
    await page.waitForTimeout(500);
    const reasonInput = page.locator('textarea').first();
    if (await reasonInput.isVisible()) await reasonInput.fill(r);
    const confirmBtn = page.locator('//button[text()="확인"]').last();
    await confirmBtn.click();
    await page.waitForLoadState('networkidle');
}
