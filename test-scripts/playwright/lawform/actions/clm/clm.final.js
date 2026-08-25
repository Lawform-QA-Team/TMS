/**
 * CLM 최종 승인 액션
 *
 * progress_status = 5 (FINANCIAL_REVIEW_COMPLETE) → 최종 결재자가 실행
 */

/** 최종 승인 */
export async function approveFinalReview(page) {
    const approveBtn = page.locator('button:has-text("승인")').first();
    await approveBtn.waitFor({ state: 'visible', timeout: 10000 });
    await approveBtn.click();
    await page.waitForTimeout(500);
    const confirmBtn = page.locator('button:has-text("확인")').last();
    if (await confirmBtn.isVisible()) await confirmBtn.click();
    await page.waitForLoadState('networkidle');
}

/** 최종 반려 */
export async function denyFinalReview(page, reason = '자동화 테스트 최종 반려') {
    const denyBtn = page.locator('button:has-text("반려")').first();
    await denyBtn.waitFor({ state: 'visible', timeout: 10000 });
    await denyBtn.click();
    await page.waitForTimeout(500);
    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible()) await textarea.fill(reason);
    const confirmBtn = page.locator('button:has-text("확인")').last();
    await confirmBtn.click();
    await page.waitForLoadState('networkidle');
}
