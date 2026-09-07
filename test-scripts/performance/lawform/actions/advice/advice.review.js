/**
 * [Action] Advice — 검토 (코멘트 / 승인 / 반려)
 */

function getEnv(key) {
    if (typeof __ENV !== 'undefined' && __ENV[key]) return __ENV[key];
    if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
    return null;
}

/**
 * 코멘트 추가
 * @param {import('k6/browser').Page} page
 * @param {string} [text]
 */
export async function addComment(page, text) {
    const comment = text || getEnv('COMMENT_TEXT') || '자동화 테스트 코멘트';
    const commentInput = page.locator('textarea[placeholder*="코멘트"], textarea[placeholder*="의견"]').first();
    if (await commentInput.isVisible()) {
        await commentInput.fill(comment);
    }
    const submitBtn = page.locator('//button[text()="등록"]').first();
    if (await submitBtn.isVisible()) await submitBtn.click();
    await page.waitForTimeout(500);
}

/** 자문 승인 */
export async function approveAdvice(page) {
    const approveBtn = page.locator('//button[text()="승인"]').first();
    await approveBtn.waitFor({ state: 'visible', timeout: 10000 });
    await approveBtn.click();
    await page.waitForTimeout(500);
    const confirmBtn = page.locator('//button[text()="확인"]').last();
    if (await confirmBtn.isVisible()) await confirmBtn.click();
    await page.waitForLoadState('networkidle');
}

/**
 * 자문 반려
 * @param {import('k6/browser').Page} page
 * @param {string} [reason]
 */
export async function denyAdvice(page, reason) {
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
