/**
 * CLM 전자서명 액션
 *
 * progress_status = 7 (USE_SEAL) 단계
 */

/** 전자서명 요청 버튼 클릭 + 확인 */
export async function requestEsign(page) {
    const btn = page.locator('button:has-text("전자서명 요청")').first();
    await btn.waitFor({ state: 'visible', timeout: 10000 });
    await btn.click();
    await page.waitForTimeout(500);
    const confirmBtn = page.locator('button:has-text("확인")').last();
    if (await confirmBtn.isVisible()) await confirmBtn.click();
    await page.waitForLoadState('networkidle');
}

/** 전자서명 현황 섹션 노출 확인 */
export async function checkEsignStatus(page) {
    const section = page.locator('text=전자서명').first();
    await section.waitFor({ state: 'visible', timeout: 10000 });
}
