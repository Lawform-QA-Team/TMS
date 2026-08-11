/**
 * CLM 법무 검토 액션
 *
 * progress_status = 2 (REVIEW_REQUEST) 단계에서 법무 담당자가 실행한다.
 */

/** 법무 검토 승인 (승인 버튼 클릭 + 확인 모달) */
export async function approveLegalReview(page) {
    const approveBtn = page.locator('button:has-text("승인")').first();
    await approveBtn.waitFor({ state: 'visible', timeout: 10000 });
    await approveBtn.click();
    await page.waitForTimeout(500);
    const confirmBtn = page.locator('button:has-text("확인")').last();
    if (await confirmBtn.isVisible()) await confirmBtn.click();
    await page.waitForLoadState('networkidle');
}

/** 법무 검토 반려 (반려 버튼 클릭 + 사유 입력 + 확인 모달) */
export async function denyLegalReview(page, reason = '자동화 테스트 반려') {
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
