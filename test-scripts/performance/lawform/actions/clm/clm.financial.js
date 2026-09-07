/**
 * [Action] CLM — 재무 검토 (요청 / 승인 / 반려)
 */

function getEnv(key) {
    if (typeof __ENV !== 'undefined' && __ENV[key]) return __ENV[key];
    if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
    return null;
}

/** 재무 검토 요청 */
export async function requestFinancialReview(page) {
    const requestBtn = page.locator('//button[text()="재무 검토 요청"]').first();
    await requestBtn.waitFor({ state: 'visible', timeout: 10000 });
    await requestBtn.click();
    await page.waitForTimeout(500);
    const confirmBtn = page.locator('//button[text()="확인"]').last();
    if (await confirmBtn.isVisible()) await confirmBtn.click();
    await page.waitForLoadState('networkidle');
}

/** 재무 검토 승인 */
export async function approveFinancialReview(page) {
    const approveBtn = page.locator('//button[text()="승인"]').first();
    await approveBtn.waitFor({ state: 'visible', timeout: 10000 });
    await approveBtn.click();
    await page.waitForTimeout(500);
    const confirmBtn = page.locator('//button[text()="확인"]').last();
    if (await confirmBtn.isVisible()) await confirmBtn.click();
    await page.waitForLoadState('networkidle');
}

/**
 * 재무 검토 반려
 * @param {import('k6/browser').Page} page
 * @param {string} [reason]
 */
export async function denyFinancialReview(page, reason) {
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
