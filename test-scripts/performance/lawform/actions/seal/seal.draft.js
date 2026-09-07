/**
 * [Action] Seal — 초안 작성
 */

/** 신규 인감 신청 버튼 클릭 */
export async function clickNewSealButton(page) {
    const newBtn = page.locator('//button[text()="신규 인감 신청"] | //button[text()="인감 신청"]').first();
    await newBtn.waitFor({ state: 'visible', timeout: 10000 });
    await newBtn.click();
    await page.waitForTimeout(500);
}
