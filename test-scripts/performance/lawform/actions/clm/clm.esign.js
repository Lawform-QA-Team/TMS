/**
 * [Action] CLM — 전자서명 요청 / 상태 확인
 */

/** 전자서명 요청 버튼 클릭 */
export async function requestEsign(page) {
    const requestBtn = page.locator('//button[text()="전자서명 요청"]').first();
    await requestBtn.waitFor({ state: 'visible', timeout: 10000 });
    await requestBtn.click();
    await page.waitForTimeout(500);
    const confirmBtn = page.locator('//button[text()="확인"]').last();
    if (await confirmBtn.isVisible()) await confirmBtn.click();
    await page.waitForLoadState('networkidle');
}

/** 전자서명 상태 확인 (상태 텍스트 로그 출력) */
export async function checkEsignStatus(page) {
    const statusEl = page.locator('[class*="status"], [class*="esign"]').first();
    if (await statusEl.isVisible()) {
        const text = await statusEl.textContent();
        console.log(`[clm.esign] 전자서명 상태: ${text}`);
    }
}
