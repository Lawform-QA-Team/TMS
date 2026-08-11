/**
 * Advice 검토 액션
 */

/** 코멘트 입력 + 제출 */
export async function addComment(page, text = '자동화 테스트 코멘트') {
    const input = page.locator('textarea[placeholder*="의견"], textarea[placeholder*="코멘트"], textarea').first();
    await input.waitFor({ state: 'visible', timeout: 10000 });
    await input.fill(text);
    const submitBtn = page.locator('button:has-text("등록"), button:has-text("저장")').first();
    await submitBtn.click();
    await page.waitForLoadState('networkidle');
}

/** 자문 완료 승인 (자문완료 또는 승인 버튼) */
export async function approveAdvice(page) {
    const btn = page.locator('button:has-text("자문완료"), button:has-text("승인")').first();
    await btn.waitFor({ state: 'visible', timeout: 10000 });
    await btn.click();
    await page.waitForTimeout(500);
    const confirmBtn = page.locator('button:has-text("확인")').last();
    if (await confirmBtn.isVisible()) await confirmBtn.click();
    await page.waitForLoadState('networkidle');
}

/** 자문 반려 */
export async function denyAdvice(page, reason = '자동화 테스트 자문 반려') {
    const btn = page.locator('button:has-text("반려")').first();
    await btn.waitFor({ state: 'visible', timeout: 10000 });
    await btn.click();
    await page.waitForTimeout(500);
    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible()) await textarea.fill(reason);
    const confirmBtn = page.locator('button:has-text("확인")').last();
    await confirmBtn.click();
    await page.waitForLoadState('networkidle');
}
