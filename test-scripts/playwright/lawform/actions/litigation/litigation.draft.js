/**
 * Litigation 초안 액션
 */

/** 신규 송무 등록 버튼 클릭 */
export async function clickNewLitigationButton(page) {
    await page.waitForSelector('//button[text()="신규 송무 등록" and not(@disabled)]');
    await page.locator('//button[text()="신규 송무 등록"]').click();
    await page.waitForLoadState('networkidle');
}
