/**
 * [Action] CLM — 초안 작성
 */

/** 신규 검토 요청 버튼 클릭 → 확인 모달 처리 */
export async function clickNewReviewRequest(page) {
    await page.waitForSelector('//button[text()="신규 검토 요청" and not(@disabled)]');
    await page.locator('//button[text()="신규 검토 요청"]').click();
    // 계약 검토 요청 확인 모달
    await page.waitForSelector('//div[contains(@class,"footer-safe-area")]//button[text()="확인" and not(@disabled)]');
    await page.locator('//div[contains(@class,"footer-safe-area")]//button[text()="확인"]').click();
    await page.waitForTimeout(10000);
}
