/**
 * CLM 재무 검토 액션
 *
 * progress_status = 3 (LEGAL_REVIEW_COMPLETE) → 재무검토 요청
 * progress_status = 4 (FINANCIAL_REVIEW)       → 재무 검토 승인/반려
 */

/** 재무검토 요청 버튼 클릭 + 확인 (법무 완료 후 요청자가 실행) */
export async function requestFinancialReview(page) {
    const btn = page.locator('button:has-text("재무검토 요청")').first();
    await btn.waitFor({ state: 'visible', timeout: 10000 });
    await btn.click();
    await page.waitForTimeout(500);
    const confirmBtn = page.locator('button:has-text("확인")').last();
    if (await confirmBtn.isVisible()) await confirmBtn.click();
    await page.waitForLoadState('networkidle');
}

/** 재무 검토 승인 (재무 담당자가 실행) */
export async function approveFinancialReview(page) {
    const approveBtn = page.locator('button:has-text("승인")').first();
    await approveBtn.waitFor({ state: 'visible', timeout: 10000 });
    await approveBtn.click();
    await page.waitForTimeout(500);
    const confirmBtn = page.locator('button:has-text("확인")').last();
    if (await confirmBtn.isVisible()) await confirmBtn.click();
    await page.waitForLoadState('networkidle');
}

/** 재무 검토 반려 */
export async function denyFinancialReview(page, reason = '자동화 테스트 재무 반려') {
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
